import { noopKeyCatalogWriter, type KeyCatalogWriter } from '../keys/ports';
import {
  noopTranslationChangeRecorder,
  toCellSnapshot,
  type TranslationChangeRecorder,
} from './change-recorder';
import {
  asAiTranslation,
  asCodeTranslation,
  asManualTranslation,
  asNeedsReview,
  canAutomaticAiWrite,
  isHumanOwned,
} from './invariants';
import {
  pickMergedTranslation,
  resolveTransitiveReplacements,
  type KeyReplacementRule,
  type MergeKeysResult,
} from './key-merge';
import {
  detectKeyRenames,
  type DetectedKeyRename,
} from './key-rename-detector';
import type { TranslationRepository } from './repository';
import {
  TranslatorError,
  type TranslateInput,
  type Translator,
} from './translator';
import type {
  AutomaticAiWriteResult,
  IncomingSourceKey,
  Translation,
  TranslationKey,
} from './types';

export type SyncFromSourceOptions = {
  removed?: readonly string[];
};

export type SyncFromSourceResult = {
  createdKeys: number;
  sourceChanges: number;
  filled: number;
  regenerated: number;
  needsReview: number;
  fillFailed: number;
  renamedKeys?: Array<{ fromKey: string; toKey: string }>;
  mergedKeys?: Array<{ fromKey: string; toKey: string; sourceText: string }>;
};

export type MergeKeysInput = {
  projectId: string;
  environmentId: string;
  sourceKeys: readonly string[];
  targetKey: string;
  sourceText?: string;
  actor?: string | null;
};

/**
 * Single domain entry point for translation mutation.
 * Automatic AI write paths all go through `writeAutomaticAiValue`.
 *
 * Every method operates on one environment's working copy. Published content
 * lives in immutable version snapshots and is never written here.
 */
export class TranslationService {
  constructor(
    private readonly repository: TranslationRepository,
    private readonly translator: Translator,
    private readonly changeRecorder: TranslationChangeRecorder = noopTranslationChangeRecorder,
    private readonly catalog: KeyCatalogWriter = noopKeyCatalogWriter
  ) {}

  async saveManualEdit(
    translationId: string,
    value: string,
    actor?: string | null
  ): Promise<Translation> {
    const translation = await this.requireTranslation(translationId);
    const key = await this.requireKey(translation.translationKeyId);
    const before = toCellSnapshot(translation);
    const updated = await this.repository.updateTranslation(
      translation.id,
      asManualTranslation(value)
    );
    await this.record(key, updated, before, actor);
    return updated;
  }

  async saveManualValue(
    translationKeyId: string,
    environmentId: string,
    locale: string,
    value: string,
    actor?: string | null
  ): Promise<Translation> {
    const key = await this.requireKey(translationKeyId);
    const existing = await this.repository.findTranslation(
      translationKeyId,
      environmentId,
      locale
    );
    const before = toCellSnapshot(existing);

    const saved = existing
      ? await this.repository.updateTranslation(
          existing.id,
          asManualTranslation(value)
        )
      : await this.repository.createTranslation({
          translationKeyId,
          environmentId,
          locale,
          ...asManualTranslation(value),
        });

    await this.record(key, saved, before, actor);
    return saved;
  }

  /**
   * Fill a missing locale value. Existing rows, whether AI or human owned,
   * are never rewritten by this operation.
   */
  async generateMissingTranslation(
    translationKeyId: string,
    environmentId: string,
    locale: string
  ): Promise<AutomaticAiWriteResult> {
    const key = await this.requireKey(translationKeyId);
    const project = await this.requireProject(key.projectId);
    const existing = await this.repository.findTranslation(
      translationKeyId,
      environmentId,
      locale
    );

    if (existing) {
      return {
        outcome: 'skipped',
        reason: 'already-exists',
        translation: existing,
      };
    }

    if (locale === project.sourceLocale) {
      const translation = await this.repository.createTranslation({
        translationKeyId,
        environmentId,
        locale,
        ...asCodeTranslation(key.sourceText),
      });
      await this.record(key, translation, null);
      return { outcome: 'written', translation };
    }

    const value = await this.translateText({
      key: key.key,
      text: key.sourceText,
      sourceLocale: project.sourceLocale,
      targetLocale: locale,
    });
    const translation = await this.repository.createTranslation({
      translationKeyId,
      environmentId,
      locale,
      ...asAiTranslation(value),
    });
    await this.record(key, translation, null);

    return { outcome: 'written', translation };
  }

  /**
   * AI-owned targets regenerate after source changes. Human-owned targets
   * retain their value and are marked for review.
   */
  async handleSourceChange(
    translationKeyId: string,
    environmentId: string,
    newSourceText: string
  ): Promise<{
    regenerated: Translation[];
    needsReview: Translation[];
  }> {
    const key = await this.requireKey(translationKeyId);
    const project = await this.requireProject(key.projectId);
    const updatedKey = await this.repository.updateKeySourceText(
      key.id,
      newSourceText
    );

    const translations = await this.repository.listTranslationsForKey(
      key.id,
      environmentId
    );
    const regenerated: Translation[] = [];
    const needsReview: Translation[] = [];

    for (const translation of translations) {
      const before = toCellSnapshot(translation);

      if (translation.locale === project.sourceLocale) {
        if (isHumanOwned(translation)) {
          const updated = await this.repository.updateTranslation(
            translation.id,
            asNeedsReview()
          );
          await this.record(updatedKey, updated, before);
          needsReview.push(updated);
        } else {
          const updated = await this.repository.updateTranslation(
            translation.id,
            asCodeTranslation(newSourceText)
          );
          await this.record(updatedKey, updated, before);
        }
        continue;
      }

      if (isHumanOwned(translation)) {
        const updated = await this.repository.updateTranslation(
          translation.id,
          asNeedsReview()
        );
        await this.record(updatedKey, updated, before);
        needsReview.push(updated);
        continue;
      }

      const written = await this.writeAutomaticAiValue(translation, {
        key: key.key,
        text: newSourceText,
        sourceLocale: project.sourceLocale,
        targetLocale: translation.locale,
      });
      if (written.outcome === 'written') {
        await this.record(updatedKey, written.translation, before);
        regenerated.push(written.translation);
      }
    }

    return { regenerated, needsReview };
  }

  async translateNewLocale(
    projectId: string,
    environmentId: string,
    locale: string
  ): Promise<{ filled: number; skipped: number }> {
    const project = await this.requireProject(projectId);
    if (!project.locales.includes(locale)) {
      await this.repository.addLocale(projectId, locale);
    }

    return this.fillMissingForLocale(projectId, environmentId, locale);
  }

  /**
   * Suggestions are read-only until explicitly accepted, so they need no
   * environment scope.
   */
  async suggestTranslation(
    translationKeyId: string,
    locale: string
  ): Promise<string> {
    const key = await this.requireKey(translationKeyId);
    const project = await this.requireProject(key.projectId);

    return this.translateText({
      key: key.key,
      text: key.sourceText,
      sourceLocale: project.sourceLocale,
      targetLocale: locale,
    });
  }

  async acceptSuggestion(
    translationId: string,
    suggestedValue: string,
    actor?: string | null
  ): Promise<Translation> {
    const translation = await this.requireTranslation(translationId);
    const key = await this.requireKey(translation.translationKeyId);
    const before = toCellSnapshot(translation);
    const patch = isHumanOwned(translation)
      ? asManualTranslation(suggestedValue)
      : asAiTranslation(suggestedValue);

    const updated = await this.repository.updateTranslation(
      translation.id,
      patch
    );
    await this.record(key, updated, before, actor);
    return updated;
  }

  async acceptSuggestionValue(
    translationKeyId: string,
    environmentId: string,
    locale: string,
    suggestedValue: string,
    actor?: string | null
  ): Promise<Translation> {
    const existing = await this.repository.findTranslation(
      translationKeyId,
      environmentId,
      locale
    );
    if (existing) {
      return this.acceptSuggestion(existing.id, suggestedValue, actor);
    }

    const key = await this.requireKey(translationKeyId);
    const created = await this.repository.createTranslation({
      translationKeyId,
      environmentId,
      locale,
      ...asAiTranslation(suggestedValue),
    });
    await this.record(key, created, null, actor);
    return created;
  }

  async markReviewed(
    translationId: string,
    actor?: string | null
  ): Promise<Translation> {
    const translation = await this.requireTranslation(translationId);
    if (!isHumanOwned(translation)) {
      return translation;
    }

    const key = await this.requireKey(translation.translationKeyId);
    const before = toCellSnapshot(translation);
    const updated = await this.repository.updateTranslation(translation.id, {
      status: 'manual',
    });
    await this.record(key, updated, before, actor);
    return updated;
  }

  async syncFromSource(
    projectId: string,
    environmentId: string,
    incoming: IncomingSourceKey[],
    options?: SyncFromSourceOptions
  ): Promise<SyncFromSourceResult> {
    const project = await this.requireProject(projectId);
    const targetLocales = project.locales.filter(
      (locale) => locale !== project.sourceLocale
    );
    let createdKeys = 0;
    let sourceChanges = 0;
    let filled = 0;
    let regenerated = 0;
    let needsReview = 0;
    let fillFailed = 0;
    const renamedKeys: Array<{ fromKey: string; toKey: string }> = [];
    const mergedKeys: Array<{
      fromKey: string;
      toKey: string;
      sourceText: string;
    }> = [];

    const existingKeys = await this.repository.findKeysByNames(
      projectId,
      incoming.map((item) => item.key)
    );
    const existingByName = new Map(existingKeys.map((key) => [key.key, key]));
    const missing: IncomingSourceKey[] = [];
    const unchanged: IncomingSourceKey[] = [];
    const changed: Array<{
      item: IncomingSourceKey;
      existing: TranslationKey;
    }> = [];

    for (const item of incoming) {
      const existing = existingByName.get(item.key);
      if (!existing) {
        missing.push(item);
      } else if (existing.sourceText === item.sourceText) {
        unchanged.push(item);
      } else {
        changed.push({ item, existing });
      }
    }

    let trulyMissing: IncomingSourceKey[] = missing;
    if (missing.length > 0) {
      const [allProjectKeys, catalogMeta, usages] = await Promise.all([
        this.repository.listKeys(projectId),
        this.catalog.listAll ? this.catalog.listAll(projectId) : [],
        this.catalog.listUsagesForProject
          ? this.catalog.listUsagesForProject(projectId)
          : [],
      ]);
      const allKeyByName = new Map(
        allProjectKeys.map((keyRow) => [keyRow.key, keyRow])
      );

      // 1. Check if any incoming missing key was previously merged into another key
      const rawReplacements = catalogMeta
        .filter(
          (meta) =>
            meta.type === 'translation' &&
            Boolean(meta.replacementKey) &&
            meta.key !== meta.replacementKey
        )
        .map((meta) => ({
          fromKey: meta.key,
          toKey: meta.replacementKey!,
        }));
      const resolvedReplacements = resolveTransitiveReplacements(rawReplacements);
      const replacementByFrom = new Map(
        resolvedReplacements.map((rule) => [rule.fromKey, rule.toKey])
      );

      const afterMergeCheck: IncomingSourceKey[] = [];
      for (const item of missing) {
        const replacementTarget = replacementByFrom.get(item.key);
        const targetKeyRow = replacementTarget
          ? allKeyByName.get(replacementTarget)
          : undefined;
        if (replacementTarget && targetKeyRow) {
          await this.catalog.recordDetection({
            projectId,
            type: 'translation',
            key: replacementTarget,
            usage: item.usage,
          });
          mergedKeys.push({
            fromKey: item.key,
            toKey: replacementTarget,
            sourceText: targetKeyRow.sourceText,
          });
        } else {
          afterMergeCheck.push(item);
        }
      }

      // 2. Detect keys that were renamed in source code
      const detectedRenames: DetectedKeyRename[] =
        afterMergeCheck.length > 0
          ? detectKeyRenames({
              missingIncoming: afterMergeCheck,
              allIncomingKeyNames: incoming.map((item) => item.key),
              removedKeys: options?.removed,
              existingKeys: allProjectKeys,
              catalogMeta,
              usages,
            })
          : [];
      const renameByToKey = new Map(
        detectedRenames.map((rename) => [rename.toKey, rename])
      );

      trulyMissing = [];
      for (const item of afterMergeCheck) {
        const rename = renameByToKey.get(item.key);
        if (!rename) {
          trulyMissing.push(item);
          continue;
        }

        const oldTranslations = await this.repository.listTranslationsForKey(
          rename.fromKeyId,
          environmentId
        );
        const renamedKey = await this.repository.renameKey(
          rename.fromKeyId,
          rename.toKey
        );
        if (this.catalog.renameDetectedKey) {
          await this.catalog.renameDetectedKey({
            projectId,
            type: 'translation',
            fromKey: rename.fromKey,
            toKey: rename.toKey,
            usage: item.usage,
          });
        } else {
          await this.catalog.recordDetection({
            projectId,
            type: 'translation',
            key: rename.toKey,
            usage: item.usage,
          });
        }

        // Record draft changes so environment publish reflects the renamed key
        for (const cell of oldTranslations) {
          const snapshot = toCellSnapshot(cell);
          if (snapshot) {
            await this.recordChangeRaw({
              environmentId,
              key: rename.fromKey,
              locale: cell.locale,
              before: snapshot,
              after: null,
            });
            await this.recordChangeRaw({
              environmentId,
              key: rename.toKey,
              locale: cell.locale,
              before: null,
              after: snapshot,
            });
          }
        }

        renamedKeys.push({
          fromKey: rename.fromKey,
          toKey: rename.toKey,
        });

        if (rename.sourceTextChanged) {
          sourceChanges += 1;
          try {
            const change = await this.handleSourceChange(
              renamedKey.id,
              environmentId,
              item.sourceText
            );
            regenerated += change.regenerated.length;
            needsReview += change.needsReview.length;
          } catch (error) {
            if (!(error instanceof TranslatorError)) {
              throw error;
            }
            fillFailed += 1;
          }
        } else {
          const presentLocales = new Set(
            oldTranslations.map((cell) => cell.locale)
          );
          if (!presentLocales.has(project.sourceLocale)) {
            const sourceRow = await this.repository.createTranslation({
              translationKeyId: renamedKey.id,
              environmentId,
              locale: project.sourceLocale,
              ...asCodeTranslation(item.sourceText),
            });
            await this.record(renamedKey, sourceRow, null);
          }
          const missingTargetLocales = targetLocales.filter(
            (locale) => !presentLocales.has(locale)
          );
          if (missingTargetLocales.length > 0) {
            const fill = await this.fillTargetsBestEffort(
              renamedKey.id,
              environmentId,
              missingTargetLocales
            );
            filled += fill.filled;
            fillFailed += fill.fillFailed;
          }
        }
      }
    }

    for (const item of trulyMissing) {
      const created = await this.repository.createKey({
        projectId,
        key: item.key,
        sourceText: item.sourceText,
      });
      createdKeys += 1;
      await this.catalog.recordDetection({
        projectId,
        type: 'translation',
        key: item.key,
        usage: item.usage,
      });
      const sourceRow = await this.repository.createTranslation({
        translationKeyId: created.id,
        environmentId,
        locale: project.sourceLocale,
        ...asCodeTranslation(item.sourceText),
      });
      await this.record(created, sourceRow, null);

      const fill = await this.fillTargetsBestEffort(
        created.id,
        environmentId,
        targetLocales
      );
      filled += fill.filled;
      fillFailed += fill.fillFailed;
    }

    if (unchanged.length > 0) {
      const quiet = unchanged.filter((item) => !item.usage?.file);
      const withUsage = unchanged.filter((item) => item.usage?.file);
      if (quiet.length > 0 && this.catalog.touchDetections) {
        await this.catalog.touchDetections({
          projectId,
          type: 'translation',
          keys: quiet.map((item) => item.key),
        });
      } else {
        for (const item of quiet) {
          await this.catalog.recordDetection({
            projectId,
            type: 'translation',
            key: item.key,
            usage: item.usage,
          });
        }
      }
      for (const item of withUsage) {
        await this.catalog.recordDetection({
          projectId,
          type: 'translation',
          key: item.key,
          usage: item.usage,
        });
      }

      const present = await this.repository.listPresentLocales(
        environmentId,
        unchanged.map((item) => existingByName.get(item.key)!.id)
      );
      const presentLocales = new Set(
        present.map((cell) => `${cell.translationKeyId}:${cell.locale}`)
      );
      for (const item of unchanged) {
        const existing = existingByName.get(item.key)!;
        const missingLocales = targetLocales.filter(
          (locale) => !presentLocales.has(`${existing.id}:${locale}`)
        );
        if (missingLocales.length === 0) {
          continue;
        }
        const fill = await this.fillTargetsBestEffort(
          existing.id,
          environmentId,
          missingLocales
        );
        filled += fill.filled;
        fillFailed += fill.fillFailed;
      }
    }

    for (const { item, existing } of changed) {
      await this.catalog.recordDetection({
        projectId,
        type: 'translation',
        key: item.key,
        usage: item.usage,
      });
      sourceChanges += 1;
      try {
        const change = await this.handleSourceChange(
          existing.id,
          environmentId,
          item.sourceText
        );
        regenerated += change.regenerated.length;
        needsReview += change.needsReview.length;
      } catch (error) {
        if (!(error instanceof TranslatorError)) {
          throw error;
        }
        fillFailed += 1;
      }
    }

    return {
      createdKeys,
      sourceChanges,
      filled,
      regenerated,
      needsReview,
      fillFailed,
      ...(renamedKeys.length > 0 ? { renamedKeys } : {}),
      ...(mergedKeys.length > 0 ? { mergedKeys } : {}),
    };
  }

  /**
   * Consolidates two or more duplicate keys into a single target key (e.g.
   * merging "feature1.ok" and "feature2.ok" into "common.ok").
   *
   * - Preserves the highest-priority translation per (environment, locale)
   *   with human-owned / locked cells winning over AI and code cells.
   * - Records draft changes so the environment's Publish workflow captures
   *   the consolidation.
   * - Marks the old keys as deprecated with `replacementKey = targetKey`
   *   so the CLI (`keykit sync` / `keykit merge-keys`) can automatically
   *   rewrite source files.
   */
  async mergeKeys(input: MergeKeysInput): Promise<MergeKeysResult> {
    const project = await this.requireProject(input.projectId);
    const targetKey = input.targetKey.trim();
    if (!targetKey) {
      throw new Error('Target key name is required');
    }

    const cleanedSourceKeys = Array.from(
      new Set(input.sourceKeys.map((key) => key.trim()).filter(Boolean))
    );
    const keysToRemove = cleanedSourceKeys.filter((key) => key !== targetKey);
    if (keysToRemove.length === 0) {
      throw new Error(
        'Select at least one key different from the target key to merge'
      );
    }

    const [allProjectKeys, allTranslations] = await Promise.all([
      this.repository.listKeys(input.projectId),
      this.repository.listProjectTranslations(input.projectId),
    ]);
    const keyByName = new Map(allProjectKeys.map((item) => [item.key, item]));

    const sourceKeyRows = cleanedSourceKeys
      .map((name) => keyByName.get(name))
      .filter((row): row is TranslationKey => Boolean(row));
    if (sourceKeyRows.length === 0) {
      throw new Error('None of the selected source keys exist in this project');
    }

    const existingTargetRow = keyByName.get(targetKey);
    const canonicalSourceText =
      input.sourceText?.trim() ||
      existingTargetRow?.sourceText ||
      sourceKeyRows[0].sourceText;

    let targetKeyRow: TranslationKey;
    if (existingTargetRow) {
      targetKeyRow =
        existingTargetRow.sourceText !== canonicalSourceText
          ? await this.repository.updateKeySourceText(
              existingTargetRow.id,
              canonicalSourceText
            )
          : existingTargetRow;
    } else {
      targetKeyRow = await this.repository.createKey({
        projectId: input.projectId,
        key: targetKey,
        sourceText: canonicalSourceText,
      });
    }

    const involvedKeyIds = new Set<string>(
      sourceKeyRows.map((row) => row.id)
    );
    involvedKeyIds.add(targetKeyRow.id);

    const involvedTranslations = allTranslations.filter((cell) =>
      involvedKeyIds.has(cell.translationKeyId)
    );
    const cellsByEnvLocale = new Map<string, Translation[]>();
    for (const cell of involvedTranslations) {
      const bucketKey = `${cell.environmentId}:::${cell.locale}`;
      const bucket = cellsByEnvLocale.get(bucketKey) ?? [];
      bucket.push(cell);
      cellsByEnvLocale.set(bucketKey, bucket);
    }

    // Consolidate cells onto targetKeyRow across all environments
    for (const [bucketKey, cells] of Array.from(cellsByEnvLocale.entries())) {
      const separatorIdx = bucketKey.indexOf(':::');
      const envId = bucketKey.slice(0, separatorIdx);
      const locale = bucketKey.slice(separatorIdx + 3);
      const winner = pickMergedTranslation(cells, existingTargetRow?.id);
      if (!winner) {
        continue;
      }

      const existingTargetCell = cells.find(
        (cell) => cell.translationKeyId === targetKeyRow.id
      );
      const before = toCellSnapshot(existingTargetCell);
      const patch =
        locale === project.sourceLocale && !isHumanOwned(winner)
          ? asCodeTranslation(canonicalSourceText)
          : {
              value: winner.value,
              source: winner.source,
              status: winner.status,
              aiLocked: winner.aiLocked,
            };

      const saved = existingTargetCell
        ? await this.repository.updateTranslation(existingTargetCell.id, patch)
        : await this.repository.createTranslation({
            translationKeyId: targetKeyRow.id,
            environmentId: envId,
            locale,
            ...patch,
          });
      await this.record(targetKeyRow, saved, before, input.actor);
    }

    // Ensure the active environment has a sourceLocale cell and filled targets
    const existingSourceCell = await this.repository.findTranslation(
      targetKeyRow.id,
      input.environmentId,
      project.sourceLocale
    );
    if (!existingSourceCell) {
      const createdSource = await this.repository.createTranslation({
        translationKeyId: targetKeyRow.id,
        environmentId: input.environmentId,
        locale: project.sourceLocale,
        ...asCodeTranslation(canonicalSourceText),
      });
      await this.record(targetKeyRow, createdSource, null, input.actor);
    }

    const targetLocales = project.locales.filter(
      (locale) => locale !== project.sourceLocale
    );
    await this.fillTargetsBestEffort(
      targetKeyRow.id,
      input.environmentId,
      targetLocales
    );

    // Record removal and delete old TranslationKey rows
    for (const oldRow of sourceKeyRows) {
      if (oldRow.id === targetKeyRow.id || oldRow.key === targetKey) {
        continue;
      }
      const oldCells = involvedTranslations.filter(
        (cell) => cell.translationKeyId === oldRow.id
      );
      for (const oldCell of oldCells) {
        const snapshot = toCellSnapshot(oldCell);
        if (snapshot) {
          await this.recordChangeRaw({
            environmentId: oldCell.environmentId,
            key: oldRow.key,
            locale: oldCell.locale,
            before: snapshot,
            after: null,
            actor: input.actor ?? null,
          });
        }
      }
      if (this.repository.deleteKey) {
        await this.repository.deleteKey(oldRow.id);
      }
    }

    if (this.catalog.markMergedKeys) {
      await this.catalog.markMergedKeys({
        projectId: input.projectId,
        fromKeys: keysToRemove,
        toKey: targetKey,
      });
    } else {
      await this.catalog.upsertDefinition({
        projectId: input.projectId,
        type: 'translation',
        key: targetKey,
        lifecycle: 'active',
      });
    }

    return {
      targetKey: targetKeyRow.key,
      targetKeyId: targetKeyRow.id,
      sourceText: canonicalSourceText,
      mergedKeys: keysToRemove,
    };
  }

  /**
   * Lists all active key replacement mappings (`fromKey -> toKey`) for a
   * project so the CLI can automatically rewrite merged keys in source code.
   */
  async listActiveKeyMerges(
    projectId: string
  ): Promise<Array<{ fromKey: string; toKey: string; sourceText: string }>> {
    if (!this.catalog.listAll) {
      return [];
    }
    const [catalogMeta, keys] = await Promise.all([
      this.catalog.listAll(projectId),
      this.repository.listKeys(projectId),
    ]);
    const keyByName = new Map(keys.map((item) => [item.key, item]));

    const rawRules: KeyReplacementRule[] = catalogMeta
      .filter(
        (meta) =>
          meta.type === 'translation' &&
          Boolean(meta.replacementKey) &&
          meta.key !== meta.replacementKey
      )
      .map((meta) => ({
        fromKey: meta.key,
        toKey: meta.replacementKey!,
      }));

    const resolved = resolveTransitiveReplacements(rawRules);
    return resolved
      .filter((rule) => keyByName.has(rule.toKey))
      .map((rule) => ({
        fromKey: rule.fromKey,
        toKey: rule.toKey,
        sourceText: keyByName.get(rule.toKey)!.sourceText,
      }));
  }

  async fillMissingForLocale(
    projectId: string,
    environmentId: string,
    locale: string
  ): Promise<{ filled: number; skipped: number }> {
    const keys = await this.repository.listKeys(projectId);
    let filled = 0;
    let skipped = 0;

    for (const key of keys) {
      const result = await this.generateMissingTranslation(
        key.id,
        environmentId,
        locale
      );
      if (result.outcome === 'written') {
        filled += 1;
      } else {
        skipped += 1;
      }
    }

    return { filled, skipped };
  }

  async translateSelection(
    projectId: string,
    environmentId: string,
    input: {
      keyIds: string[];
      locales: string[];
      mode: 'fill-missing' | 'retranslate';
      sourceLocale?: string;
    }
  ): Promise<{ filled: number; skipped: number; failed: number }> {
    const project = await this.requireProject(projectId);
    const targets = this.uniqueLocales(input.locales);
    if (!targets.length) {
      throw new Error('Select at least one locale');
    }
    const keyIds = Array.from(
      new Set(input.keyIds.map((id) => id.trim()).filter(Boolean))
    );
    if (!keyIds.length) {
      throw new Error('Select at least one key');
    }
    for (const locale of targets) {
      if (!project.locales.includes(locale)) {
        throw new Error(`Locale not found in project: ${locale}`);
      }
    }

    let filled = 0;
    let skipped = 0;
    let failed = 0;

    for (const keyId of keyIds) {
      const key = await this.repository.getKey(keyId);
      if (!key || key.projectId !== projectId) {
        skipped += targets.length;
        continue;
      }

      for (const locale of targets) {
        try {
          if (input.mode === 'fill-missing') {
            const result = await this.generateMissingTranslation(
              key.id,
              environmentId,
              locale
            );
            if (result.outcome === 'written') {
              filled += 1;
            } else {
              skipped += 1;
            }
            continue;
          }

          const sourceLocale = (
            input.sourceLocale ?? project.sourceLocale
          ).trim();
          if (!sourceLocale) {
            throw new Error('Source locale is required');
          }
          const result = await this.retranslateCell(
            project.sourceLocale,
            key,
            environmentId,
            locale,
            sourceLocale
          );
          if (result.outcome === 'written') {
            filled += 1;
          } else {
            skipped += 1;
          }
        } catch (error) {
          if (!(error instanceof TranslatorError)) {
            throw error;
          }
          failed += 1;
        }
      }
    }

    return { filled, skipped, failed };
  }

  /**
   * Rewrite selected locales from the project source text.
   * Human-owned cells are never replaced. `fromLocale` is the language the
   * source strings are actually written in, which may differ from the
   * project's configured source locale.
   */
  async retranslateLocales(
    projectId: string,
    environmentId: string,
    locales: string[],
    fromLocale?: string
  ): Promise<{ filled: number; skipped: number; failed: number }> {
    const project = await this.requireProject(projectId);
    const targets = this.uniqueLocales(locales);
    if (!targets.length) {
      throw new Error('Select at least one locale to retranslate');
    }
    for (const locale of targets) {
      if (!project.locales.includes(locale)) {
        throw new Error(`Locale not found in project: ${locale}`);
      }
    }

    const sourceLocale = (fromLocale ?? project.sourceLocale).trim();
    if (!sourceLocale) {
      throw new Error('Source locale is required');
    }

    const keys = await this.repository.listKeys(projectId);
    return this.translateSelection(projectId, environmentId, {
      keyIds: keys.map((key) => key.id),
      locales: targets,
      mode: 'retranslate',
      sourceLocale,
    });
  }

  private async retranslateCell(
    projectSourceLocale: string,
    key: TranslationKey,
    environmentId: string,
    locale: string,
    fromLocale: string
  ): Promise<AutomaticAiWriteResult> {
    const existing = await this.repository.findTranslation(
      key.id,
      environmentId,
      locale
    );
    if (!canAutomaticAiWrite(existing)) {
      return {
        outcome: 'skipped',
        reason: existing?.aiLocked ? 'ai-locked' : 'human-owned',
        translation: existing ?? undefined,
      };
    }
    const before = toCellSnapshot(existing);

    if (locale === fromLocale) {
      const patch =
        locale === projectSourceLocale
          ? asCodeTranslation(key.sourceText)
          : asAiTranslation(key.sourceText);
      const translation = existing
        ? await this.repository.updateTranslation(existing.id, patch)
        : await this.repository.createTranslation({
            translationKeyId: key.id,
            environmentId,
            locale,
            ...patch,
          });
      await this.record(key, translation, before);
      return { outcome: 'written', translation };
    }

    const value = await this.translateText({
      key: key.key,
      text: key.sourceText,
      sourceLocale: fromLocale,
      targetLocale: locale,
    });
    const translation = existing
      ? await this.repository.updateTranslation(
          existing.id,
          asAiTranslation(value)
        )
      : await this.repository.createTranslation({
          translationKeyId: key.id,
          environmentId,
          locale,
          ...asAiTranslation(value),
        });
    await this.record(key, translation, before);
    return { outcome: 'written', translation };
  }

  private uniqueLocales(locales: string[]): string[] {
    return Array.from(
      new Set(locales.map((locale) => locale.trim()).filter(Boolean))
    );
  }

  private async writeAutomaticAiValue(
    translation: Translation,
    input: {
      key: string;
      text: string;
      sourceLocale: string;
      targetLocale: string;
    }
  ): Promise<AutomaticAiWriteResult> {
    if (!canAutomaticAiWrite(translation)) {
      return {
        outcome: 'skipped',
        reason: translation.aiLocked ? 'ai-locked' : 'human-owned',
        translation,
      };
    }

    const value = await this.translateText(input);
    const updated = await this.repository.updateTranslation(
      translation.id,
      asAiTranslation(value)
    );
    return { outcome: 'written', translation: updated };
  }

  private async fillTargetsBestEffort(
    translationKeyId: string,
    environmentId: string,
    locales: string[]
  ): Promise<{ filled: number; fillFailed: number }> {
    let filled = 0;
    let fillFailed = 0;

    for (const locale of locales) {
      try {
        const result = await this.generateMissingTranslation(
          translationKeyId,
          environmentId,
          locale
        );
        if (result.outcome === 'written') {
          filled += 1;
        }
      } catch (error) {
        if (!(error instanceof TranslatorError)) {
          throw error;
        }
        fillFailed += 1;
      }
    }

    return { filled, fillFailed };
  }

  private async translateText(input: TranslateInput): Promise<string> {
    try {
      return await this.translator.translate(input);
    } catch (error) {
      if (error instanceof TranslatorError) {
        throw error;
      }
      throw new TranslatorError(
        error instanceof Error ? error.message : 'AI translation failed'
      );
    }
  }

  /**
   * Report the edit into the environment's open draft version. Recording is
   * an audit trail only, so a recorder failure must not roll back a write
   * that already succeeded.
   */
  private async record(
    key: TranslationKey,
    translation: Translation,
    before: ReturnType<typeof toCellSnapshot>,
    actor?: string | null
  ): Promise<void> {
    const after = toCellSnapshot(translation);
    if (before && after && this.isSameCell(before, after)) {
      return;
    }

    await this.recordChangeRaw({
      environmentId: translation.environmentId,
      key: key.key,
      locale: translation.locale,
      before,
      after,
      actor: actor ?? null,
    });
  }

  private async recordChangeRaw(input: {
    environmentId: string;
    key: string;
    locale: string;
    before: ReturnType<typeof toCellSnapshot>;
    after: ReturnType<typeof toCellSnapshot>;
    actor?: string | null;
  }): Promise<void> {
    try {
      await this.changeRecorder.recordTranslationChange({
        environmentId: input.environmentId,
        key: input.key,
        locale: input.locale,
        before: input.before,
        after: input.after,
        actor: input.actor ?? null,
      });
    } catch (error) {
      console.error('Unable to record translation change.', error);
    }
  }

  private isSameCell(
    before: NonNullable<ReturnType<typeof toCellSnapshot>>,
    after: NonNullable<ReturnType<typeof toCellSnapshot>>
  ): boolean {
    return (
      before.value === after.value &&
      before.source === after.source &&
      before.status === after.status &&
      before.aiLocked === after.aiLocked
    );
  }

  private async requireTranslation(id: string): Promise<Translation> {
    const translation = await this.repository.getTranslation(id);
    if (!translation) {
      throw new Error(`Translation not found: ${id}`);
    }
    return translation;
  }

  private async requireKey(id: string): Promise<TranslationKey> {
    const key = await this.repository.getKey(id);
    if (!key) {
      throw new Error(`Translation key not found: ${id}`);
    }
    return key;
  }

  private async requireProject(id: string) {
    const project = await this.repository.getProject(id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    return project;
  }
}
