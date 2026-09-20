import type { KeyCatalogRepository } from '../keys/repository';
import type { KeyMeta, SourceUsage } from '../keys/types';
import type { EnvironmentService } from '../environments/environment-service';
import type { Environment } from '../environments/types';
import {
  filterDashboardRows,
  paginateTranslationDashboard,
  projectTranslationDashboard,
  type DashboardQuery,
  type TranslationDashboard,
} from './dashboard-projector';
import type { TranslationRepository } from './repository';
import type { ProjectService } from './project-service';
import type { TranslationService } from './translation-service';
import type {
  Project,
  Translation,
  TranslationFilter,
  TranslationKey,
} from './types';

/**
 * Team-scoped facade over the translation domain. Every mutating call
 * resolves the target environment first, so a caller can never write into an
 * environment belonging to another team's project.
 */
export class TeamTranslationService {
  constructor(
    private readonly repository: TranslationRepository,
    private readonly projectService: ProjectService,
    private readonly translationService: TranslationService,
    private readonly environmentService: EnvironmentService,
    private readonly keys?: KeyCatalogRepository
  ) {}

  async dashboard(
    teamId: string,
    projectId: string,
    environmentRef?: string | null,
    query?: Partial<DashboardQuery>
  ): Promise<TranslationDashboard> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const [keys, translations] = await Promise.all([
      this.repository.listKeys(project.id),
      this.repository.listTranslations(project.id, environment.id),
    ]);
    let catalog: KeyMeta[] = [];
    let usages: SourceUsage[] = [];
    try {
      if (this.keys) {
        [catalog, usages] = await Promise.all([
          this.keys.listAll(project.id),
          this.keys.listUsagesForProject(project.id),
        ]);
      }
    } catch (error) {
      console.error('Unable to load key catalog for dashboard.', error);
    }
    const catalogByKey = Object.fromEntries(
      catalog.map((item) => [item.key, item])
    );
    const catalogById = Object.fromEntries(catalog.map((item) => [item.id, item]));
    const usageFilesByKey: Record<string, string[]> = {};
    for (const usage of usages) {
      const meta = catalogById[usage.keyMetaId];
      if (!meta) {
        continue;
      }
      const files = usageFilesByKey[meta.key] ?? [];
      if (files.indexOf(usage.file) === -1) {
        files.push(usage.file);
      }
      usageFilesByKey[meta.key] = files;
    }
    return paginateTranslationDashboard(
      projectTranslationDashboard(
        project,
        environment,
        keys,
        translations,
        catalogByKey,
        usageFilesByKey
      ),
      query
    );
  }

  async saveManualByKey(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    keyName: string,
    locale: string,
    value: string,
    actor?: string | null
  ): Promise<Translation> {
    const { project } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const key = await this.repository.findKeyByName(project.id, keyName);
    if (!key) {
      throw new Error(`Translation key not found: ${keyName}`);
    }
    return this.saveManual(
      teamId,
      projectId,
      environmentRef,
      key.id,
      locale,
      value,
      actor
    );
  }

  async getKeyByName(teamId: string, projectId: string, keyName: string) {
    const project = await this.projectService.get(teamId, projectId);
    return this.repository.findKeyByName(project.id, keyName);
  }

  async saveManual(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    keyId: string,
    locale: string,
    value: string,
    actor?: string | null
  ): Promise<Translation> {
    const { environment } = await this.requireCell(
      teamId,
      projectId,
      environmentRef,
      keyId,
      locale
    );
    return this.translationService.saveManualValue(
      keyId,
      environment.id,
      locale,
      value,
      actor
    );
  }

  async suggest(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    keyId: string,
    locale: string
  ): Promise<string> {
    await this.requireCell(teamId, projectId, environmentRef, keyId, locale);
    return this.translationService.suggestTranslation(keyId, locale);
  }

  async acceptSuggestion(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    keyId: string,
    locale: string,
    value: string,
    actor?: string | null
  ): Promise<Translation> {
    const { environment } = await this.requireCell(
      teamId,
      projectId,
      environmentRef,
      keyId,
      locale
    );
    return this.translationService.acceptSuggestionValue(
      keyId,
      environment.id,
      locale,
      value,
      actor
    );
  }

  async markReviewed(
    teamId: string,
    projectId: string,
    translationId: string,
    actor?: string | null
  ): Promise<Translation> {
    await this.requireTranslation(teamId, projectId, translationId);
    return this.translationService.markReviewed(translationId, actor);
  }

  async addLocaleAndFill(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    locale: string
  ): Promise<{ project: Project; filled: number; skipped: number }> {
    const { environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    const result = await this.translationService.translateNewLocale(
      projectId,
      environment.id,
      locale
    );
    const project = await this.projectService.get(teamId, projectId);
    return { project, ...result };
  }

  async fillMissing(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    locale: string
  ): Promise<{ filled: number; skipped: number }> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    this.requireProjectLocale(project, locale);
    return this.translationService.fillMissingForLocale(
      project.id,
      environment.id,
      locale
    );
  }

  async retranslate(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    locales: string[],
    sourceLocale?: string
  ): Promise<{ filled: number; skipped: number; failed: number }> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    for (const locale of locales) {
      this.requireProjectLocale(project, locale);
    }
    return this.translationService.retranslateLocales(
      project.id,
      environment.id,
      locales,
      sourceLocale
    );
  }

  async queueTranslations(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    input: {
      scope: 'all-matching' | 'selected-keys';
      keyIds?: string[];
      locales: string[];
      mode: 'fill-missing' | 'retranslate';
      sourceLocale?: string;
      filter?: TranslationFilter;
      search?: string;
    }
  ): Promise<{ queued: number; filled: number; skipped: number; failed: number }> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    for (const locale of input.locales) {
      this.requireProjectLocale(project, locale);
    }

    let keyIds = input.keyIds ?? [];
    if (input.scope === 'all-matching') {
      const [keys, translations] = await Promise.all([
        this.repository.listKeys(project.id),
        this.repository.listTranslations(project.id, environment.id),
      ]);
      let catalog: KeyMeta[] = [];
      let usages: SourceUsage[] = [];
      try {
        if (this.keys) {
          [catalog, usages] = await Promise.all([
            this.keys.listAll(project.id),
            this.keys.listUsagesForProject(project.id),
          ]);
        }
      } catch (error) {
        console.error('Unable to load key catalog for translation queue.', error);
      }
      const catalogByKey = Object.fromEntries(
        catalog.map((item) => [item.key, item])
      );
      const catalogById = Object.fromEntries(catalog.map((item) => [item.id, item]));
      const usageFilesByKey: Record<string, string[]> = {};
      for (const usage of usages) {
        const meta = catalogById[usage.keyMetaId];
        if (!meta) {
          continue;
        }
        const files = usageFilesByKey[meta.key] ?? [];
        if (files.indexOf(usage.file) === -1) {
          files.push(usage.file);
        }
        usageFilesByKey[meta.key] = files;
      }
      const fullDashboard = projectTranslationDashboard(
        project,
        environment,
        keys,
        translations,
        catalogByKey,
        usageFilesByKey
      );
      const filtered = filterDashboardRows(fullDashboard.rows, {
        filter: input.filter ?? 'all',
        search: input.search ?? '',
      });
      keyIds = filtered.map((row) => row.keyId);
    }

    const uniqueKeyIds = Array.from(new Set(keyIds));
    const queued = uniqueKeyIds.length * input.locales.length;
    if (!uniqueKeyIds.length) {
      return { queued: 0, filled: 0, skipped: 0, failed: 0 };
    }

    const result = await this.translationService.translateSelection(
      project.id,
      environment.id,
      {
        keyIds: uniqueKeyIds,
        locales: input.locales,
        mode: input.mode,
        sourceLocale: input.sourceLocale,
      }
    );
    return { queued, ...result };
  }

  private async requireScope(
    teamId: string,
    projectId: string,
    environmentRef?: string | null
  ): Promise<{ project: Project; environment: Environment }> {
    const project = await this.projectService.get(teamId, projectId);
    const environment = await this.environmentService.resolve(
      project.id,
      environmentRef
    );
    return { project, environment };
  }

  private async requireCell(
    teamId: string,
    projectId: string,
    environmentRef: string | null | undefined,
    keyId: string,
    locale: string
  ): Promise<{
    project: Project;
    environment: Environment;
    key: TranslationKey;
  }> {
    const { project, environment } = await this.requireScope(
      teamId,
      projectId,
      environmentRef
    );
    this.requireProjectLocale(project, locale);
    const key = await this.repository.getKey(keyId);
    if (!key || key.projectId !== project.id) {
      throw new Error(`Translation key not found: ${keyId}`);
    }
    return { project, environment, key };
  }

  private async requireTranslation(
    teamId: string,
    projectId: string,
    translationId: string
  ): Promise<Translation> {
    const project = await this.projectService.get(teamId, projectId);
    const translation = await this.repository.getTranslation(translationId);
    if (!translation) {
      throw new Error(`Translation not found: ${translationId}`);
    }
    const key = await this.repository.getKey(translation.translationKeyId);
    if (!key || key.projectId !== project.id) {
      throw new Error(`Translation not found: ${translationId}`);
    }
    // The row must also belong to an environment inside this project.
    await this.environmentService.requireProjectEnvironment(
      project.id,
      translation.environmentId
    );
    return translation;
  }

  private requireProjectLocale(project: Project, locale: string): void {
    if (!project.locales.includes(locale)) {
      throw new Error(`Locale not found in project: ${locale}`);
    }
  }
}
