import type { EnvironmentRepository } from '../environments/repository';
import type { Environment } from '../environments/types';
import { EMPTY_FLAG_SET, type FlagSetSnapshot } from '../flags/types';
import type { FlagChange } from '../flags/change-recorder';
import type { TranslationChange } from '../translations/change-recorder';
import type { TranslationRepository } from '../translations/repository';
import type {
  Project,
  Translation,
  TranslationKey,
} from '../translations/types';
import type { FlagSnapshotProvider } from './ports';
import type { VersionRepository } from './repository';
import {
  buildLocaleBundles,
  cellId,
  diffSnapshots,
  planPromotion,
  type PromotionTargetCell,
} from './snapshot';
import {
  MAX_VERSION_HISTORY,
  type LocaleBundleSnapshot,
  type PromotionPlan,
  type PublishResult,
  type Version,
  type VersionChange,
  type VersionDiff,
} from './types';

export type EnvironmentStatus = {
  environment: Environment;
  liveVersion: Version | null;
  draft: Version | null;
  diff: VersionDiff;
  pendingCount: number;
};

export class VersionNotPublishedError extends Error {
  constructor(versionId: string) {
    super(`Version is not published: ${versionId}`);
    this.name = 'VersionNotPublishedError';
  }
}

/**
 * Owns the draft/publish pipeline for each environment.
 *
 * One draft version is open per environment at a time. Saves append change
 * records to it; publishing seals it into immutable snapshots and repoints the
 * environment's live pointer. Nothing here mutates published content.
 */
export class VersionService {
  constructor(
    private readonly repository: VersionRepository,
    private readonly translations: TranslationRepository,
    private readonly environments: EnvironmentRepository,
    private readonly flags: FlagSnapshotProvider
  ) {}

  /* ---------- Draft tracking ---------- */

  async openDraft(
    environmentId: string,
    actor?: string | null
  ): Promise<Version> {
    const existing = await this.repository.findDraft(environmentId);
    if (existing) {
      return existing;
    }
    return this.repository.createDraft({
      environmentId,
      createdBy: actor ?? null,
    });
  }

  /** Satisfies `TranslationChangeRecorder`. */
  async recordTranslationChange(change: TranslationChange): Promise<void> {
    const draft = await this.openDraft(change.environmentId, change.actor);
    await this.repository.appendChange({
      versionId: draft.id,
      entityType: 'translation',
      entityKey: change.key,
      locale: change.locale,
      before: change.before,
      after: change.after,
      actor: change.actor ?? null,
    });
  }

  /** Satisfies `FlagChangeRecorder`. */
  async recordFlagChange(change: FlagChange): Promise<void> {
    const draft = await this.openDraft(change.environmentId, change.actor);
    await this.repository.appendChange({
      versionId: draft.id,
      entityType: 'flag',
      entityKey: change.key,
      locale: null,
      before: change.before,
      after: change.after,
      actor: change.actor ?? null,
      reason: change.reason ?? null,
    });
  }

  /* ---------- Reads ---------- */

  async listVersions(
    environmentId: string,
    limit = MAX_VERSION_HISTORY
  ): Promise<Version[]> {
    return this.repository.listVersions(environmentId, limit);
  }

  async listChanges(versionId: string): Promise<VersionChange[]> {
    return this.repository.listChanges(versionId);
  }

  async listChangesForKey(
    environmentId: string,
    entityType: 'translation' | 'flag',
    entityKey: string
  ): Promise<VersionChange[]> {
    const versions = await this.repository.listVersions(environmentId, 50);
    const changes: VersionChange[] = [];
    for (const version of versions) {
      const items = await this.repository.listChanges(version.id);
      for (const change of items) {
        if (change.entityType === entityType && change.entityKey === entityKey) {
          changes.push(change);
        }
      }
    }
    return changes.sort(
      (left, right) => left.createdAt.getTime() - right.createdAt.getTime()
    );
  }

  async status(environmentId: string): Promise<EnvironmentStatus> {
    const environment = await this.requireEnvironment(environmentId);
    const [working, live, draft] = await Promise.all([
      this.buildWorkingSnapshot(environment),
      this.loadLiveSnapshot(environment),
      this.repository.findDraft(environmentId),
    ]);
    const diff = diffSnapshots(live, working);

    return {
      environment,
      liveVersion: environment.liveVersionId
        ? await this.repository.getVersion(environment.liveVersionId)
        : null,
      draft,
      diff,
      pendingCount: diff.total,
    };
  }

  async diff(environmentId: string): Promise<VersionDiff> {
    const environment = await this.requireEnvironment(environmentId);
    const [working, live] = await Promise.all([
      this.buildWorkingSnapshot(environment),
      this.loadLiveSnapshot(environment),
    ]);
    return diffSnapshots(live, working);
  }

  /**
   * The published bundle an SDK caller should receive. Falls back to the
   * working copy only when an environment has never been published, so a
   * brand new environment is not a hard error for the client.
   */
  async resolveLocaleBundle(
    environmentId: string,
    locale: string,
    versionNumber?: number | null
  ): Promise<{
    bundle: LocaleBundleSnapshot | null;
    version: Version | null;
  }> {
    const environment = await this.requireEnvironment(environmentId);

    if (versionNumber !== undefined && versionNumber !== null) {
      const versions = await this.repository.listVersions(environmentId);
      const pinned = versions.find(
        (version) =>
          version.number === versionNumber && version.status === 'published'
      );
      if (!pinned) {
        return { bundle: null, version: null };
      }
      return {
        bundle: await this.repository.getLocaleBundle(pinned.id, locale),
        version: pinned,
      };
    }

    if (!environment.liveVersionId) {
      const working = await this.buildWorkingSnapshot(environment);
      return {
        bundle:
          working.locales.find((bundle) => bundle.locale === locale) ?? null,
        version: null,
      };
    }

    const version = await this.repository.getVersion(
      environment.liveVersionId
    );
    return {
      bundle: await this.repository.getLocaleBundle(
        environment.liveVersionId,
        locale
      ),
      version,
    };
  }

  /** The published flag set for an environment, used by the SDK payload. */
  async resolveFlags(environmentId: string): Promise<{
    flags: FlagSetSnapshot;
    version: Version | null;
  }> {
    const environment = await this.requireEnvironment(environmentId);
    if (!environment.liveVersionId) {
      return {
        flags: await this.flags.buildSnapshot(environmentId),
        version: null,
      };
    }

    const [flags, version] = await Promise.all([
      this.repository.getFlagsSnapshot(environment.liveVersionId),
      this.repository.getVersion(environment.liveVersionId),
    ]);
    return { flags: flags ?? EMPTY_FLAG_SET, version };
  }

  /* ---------- Publish ---------- */

  async publish(
    environmentId: string,
    options: { message?: string | null; actor?: string | null } = {}
  ): Promise<PublishResult> {
    const environment = await this.requireEnvironment(environmentId);
    const [working, live] = await Promise.all([
      this.buildWorkingSnapshot(environment),
      this.loadLiveSnapshot(environment),
    ]);
    const diff = diffSnapshots(live, working);

    if (diff.total === 0 && environment.liveVersionId) {
      const current = await this.repository.getVersion(
        environment.liveVersionId
      );
      if (current) {
        return {
          version: current,
          changed: false,
          localeCount: working.locales.length,
          flagCount: working.flags.flags.length,
        };
      }
    }

    const draft = await this.openDraft(environmentId, options.actor);
    const sealed = await this.repository.sealVersion(
      draft.id,
      {
        message: options.message?.trim() || null,
        publishedBy: options.actor ?? null,
        flagsSnapshot: working.flags,
      },
      working.locales
    );

    await this.environments.updateEnvironment(environment.id, {
      liveVersionId: sealed.id,
    });
    await this.repository.pruneHistory(environmentId, MAX_VERSION_HISTORY);

    return {
      version: sealed,
      changed: true,
      localeCount: working.locales.length,
      flagCount: working.flags.flags.length,
    };
  }

  async rollback(
    environmentId: string,
    versionId: string
  ): Promise<Version> {
    const environment = await this.requireEnvironment(environmentId);
    const version = await this.repository.getVersion(versionId);
    if (!version || version.environmentId !== environment.id) {
      throw new Error(`Version not found: ${versionId}`);
    }
    if (version.status !== 'published') {
      throw new VersionNotPublishedError(versionId);
    }

    await this.environments.updateEnvironment(environment.id, {
      liveVersionId: version.id,
    });
    return version;
  }

  /* ---------- Promotion ---------- */

  async previewPromotion(
    sourceEnvironmentId: string,
    targetEnvironmentId: string,
    versionId?: string | null
  ): Promise<PromotionPlan> {
    return (
      await this.buildPromotion(
        sourceEnvironmentId,
        targetEnvironmentId,
        versionId
      )
    ).plan;
  }

  /**
   * Merge a sealed version into another environment's working copy.
   *
   * Conflicting cells are reported, never overwritten, so promoting AI output
   * from staging can't silently discard a translation a human fixed in
   * production. The caller publishes the target afterwards.
   */
  async applyPromotion(
    sourceEnvironmentId: string,
    targetEnvironmentId: string,
    options: {
      versionId?: string | null;
      actor?: string | null;
    } = {}
  ): Promise<{ plan: PromotionPlan; applied: number }> {
    const { plan, keysByName, targetEnvironment, sourceVersionId } =
      await this.buildPromotion(
        sourceEnvironmentId,
        targetEnvironmentId,
        options.versionId
      );

    const draft = await this.openDraft(targetEnvironment.id, options.actor);
    let applied = 0;

    for (const entry of plan.entries) {
      if (entry.action !== 'apply') {
        continue;
      }
      const key = keysByName.get(entry.key);
      if (!key) {
        continue;
      }

      const metadata = {
        value: entry.incoming,
        source: entry.incomingSource,
        status:
          entry.incomingSource === 'manual'
            ? ('manual' as const)
            : entry.incomingSource === 'code'
              ? ('source' as const)
              : ('ai' as const),
        aiLocked: entry.incomingSource === 'manual',
      };

      const existing = await this.translations.findTranslation(
        key.id,
        targetEnvironment.id,
        entry.locale
      );
      if (existing) {
        await this.translations.updateTranslation(existing.id, metadata);
      } else {
        await this.translations.createTranslation({
          translationKeyId: key.id,
          environmentId: targetEnvironment.id,
          locale: entry.locale,
          ...metadata,
        });
      }

      await this.repository.appendChange({
        versionId: draft.id,
        entityType: 'translation',
        entityKey: entry.key,
        locale: entry.locale,
        before: entry.current === null ? null : { value: entry.current },
        after: { value: entry.incoming, source: entry.incomingSource },
        actor: options.actor ?? null,
      });
      applied += 1;
    }

    await this.repository.appendChange({
      versionId: draft.id,
      entityType: 'flag',
      entityKey: '*',
      locale: null,
      before: null,
      after: { promotedFrom: sourceVersionId, flagCount: plan.flagCount },
      actor: options.actor ?? null,
    });

    return { plan, applied };
  }

  private async buildPromotion(
    sourceEnvironmentId: string,
    targetEnvironmentId: string,
    versionId?: string | null
  ): Promise<{
    plan: PromotionPlan;
    keysByName: Map<string, TranslationKey>;
    targetEnvironment: Environment;
    sourceVersionId: string;
  }> {
    if (sourceEnvironmentId === targetEnvironmentId) {
      throw new Error('Choose a different environment to promote into');
    }

    const source = await this.requireEnvironment(sourceEnvironmentId);
    const target = await this.requireEnvironment(targetEnvironmentId);
    if (source.projectId !== target.projectId) {
      throw new Error('Environments belong to different projects');
    }

    const resolvedVersionId = versionId ?? source.liveVersionId;
    if (!resolvedVersionId) {
      throw new Error(
        `Publish ${source.name} before promoting it to another environment`
      );
    }

    const version = await this.repository.getVersion(resolvedVersionId);
    if (!version || version.environmentId !== source.id) {
      throw new Error(`Version not found: ${resolvedVersionId}`);
    }
    if (version.status !== 'published') {
      throw new VersionNotPublishedError(resolvedVersionId);
    }

    const project = await this.requireProject(target.projectId);
    const [incoming, keys, currentTranslations, flags] = await Promise.all([
      this.repository.listLocaleBundles(version.id),
      this.translations.listKeys(project.id),
      this.translations.listTranslations(project.id, target.id),
      this.repository.getFlagsSnapshot(version.id),
    ]);

    const keysById = new Map(keys.map((key) => [key.id, key]));
    const keysByName = new Map(keys.map((key) => [key.key, key]));
    const currentCells = new Map<string, PromotionTargetCell>();
    for (const translation of currentTranslations) {
      const key = keysById.get(translation.translationKeyId);
      if (key) {
        currentCells.set(cellId(translation.locale, key.key), translation);
      }
    }

    const plan = planPromotion({
      sourceEnvironmentId: source.id,
      targetEnvironmentId: target.id,
      sourceVersionId: version.id,
      sourceVersionNumber: version.number,
      incoming,
      currentCells,
      targetLocales: project.locales,
      flagCount: flags?.flags.length ?? 0,
    });

    return {
      plan,
      keysByName,
      targetEnvironment: target,
      sourceVersionId: version.id,
    };
  }

  /* ---------- Snapshot helpers ---------- */

  private async buildWorkingSnapshot(environment: Environment): Promise<{
    locales: LocaleBundleSnapshot[];
    flags: FlagSetSnapshot;
  }> {
    const project = await this.requireProject(environment.projectId);
    const [keys, translations, flags] = await Promise.all([
      this.translations.listKeys(project.id),
      this.translations.listTranslations(project.id, environment.id),
      this.flags.buildSnapshot(environment.id),
    ]);

    return {
      locales: buildLocaleBundles(project, keys, translations as Translation[]),
      flags,
    };
  }

  private async loadLiveSnapshot(environment: Environment): Promise<{
    locales: LocaleBundleSnapshot[];
    flags: FlagSetSnapshot;
  } | null> {
    if (!environment.liveVersionId) {
      return null;
    }
    const [locales, flags] = await Promise.all([
      this.repository.listLocaleBundles(environment.liveVersionId),
      this.repository.getFlagsSnapshot(environment.liveVersionId),
    ]);
    return { locales, flags: flags ?? EMPTY_FLAG_SET };
  }

  private async requireEnvironment(id: string): Promise<Environment> {
    const environment = await this.environments.getEnvironment(id);
    if (!environment) {
      throw new Error(`Environment not found: ${id}`);
    }
    return environment;
  }

  private async requireProject(id: string): Promise<Project> {
    const project = await this.translations.getProject(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    return project;
  }
}
