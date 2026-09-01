import {
  asAiTranslation,
  asCodeTranslation,
  asManualTranslation,
  asNeedsReview,
  canAutomaticAiWrite,
  isHumanOwned,
} from './invariants';
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

/**
 * Single domain entry point for translation mutation.
 * Automatic AI write paths all go through `writeAutomaticAiValue`.
 */
export class TranslationService {
  constructor(
    private readonly repository: TranslationRepository,
    private readonly translator: Translator
  ) {}

  async saveManualEdit(
    translationId: string,
    value: string
  ): Promise<Translation> {
    const translation = await this.requireTranslation(translationId);
    return this.repository.updateTranslation(
      translation.id,
      asManualTranslation(value)
    );
  }

  async saveManualValue(
    translationKeyId: string,
    locale: string,
    value: string
  ): Promise<Translation> {
    const existing = await this.repository.findTranslation(
      translationKeyId,
      locale
    );
    if (existing) {
      return this.saveManualEdit(existing.id, value);
    }

    await this.requireKey(translationKeyId);
    return this.repository.createTranslation({
      translationKeyId,
      locale,
      ...asManualTranslation(value),
    });
  }

  /**
   * Fill a missing locale value. Existing rows, whether AI or human owned,
   * are never rewritten by this operation.
   */
  async generateMissingTranslation(
    translationKeyId: string,
    locale: string
  ): Promise<AutomaticAiWriteResult> {
    const key = await this.requireKey(translationKeyId);
    const project = await this.requireProject(key.projectId);
    const existing = await this.repository.findTranslation(
      translationKeyId,
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
        locale,
        ...asCodeTranslation(key.sourceText),
      });
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
      locale,
      ...asAiTranslation(value),
    });

    return { outcome: 'written', translation };
  }

  /**
   * AI-owned targets regenerate after source changes. Human-owned targets
   * retain their value and are marked for review.
   */
  async handleSourceChange(
    translationKeyId: string,
    newSourceText: string
  ): Promise<{
    regenerated: Translation[];
    needsReview: Translation[];
  }> {
    const key = await this.requireKey(translationKeyId);
    const project = await this.requireProject(key.projectId);
    await this.repository.updateKeySourceText(key.id, newSourceText);

    const translations = await this.repository.listTranslationsForKey(key.id);
    const regenerated: Translation[] = [];
    const needsReview: Translation[] = [];

    for (const translation of translations) {
      if (translation.locale === project.sourceLocale) {
        if (isHumanOwned(translation)) {
          const updated = await this.repository.updateTranslation(
            translation.id,
            asNeedsReview()
          );
          needsReview.push(updated);
        } else {
          await this.repository.updateTranslation(
            translation.id,
            asCodeTranslation(newSourceText)
          );
        }
        continue;
      }

      if (isHumanOwned(translation)) {
        const updated = await this.repository.updateTranslation(
          translation.id,
          asNeedsReview()
        );
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
        regenerated.push(written.translation);
      }
    }

    return { regenerated, needsReview };
  }

  async translateNewLocale(
    projectId: string,
    locale: string
  ): Promise<{ filled: number; skipped: number }> {
    const project = await this.requireProject(projectId);
    if (!project.locales.includes(locale)) {
      await this.repository.addLocale(projectId, locale);
    }

    return this.fillMissingForLocale(projectId, locale);
  }

  /**
   * Suggestions are read-only until explicitly accepted.
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
    suggestedValue: string
  ): Promise<Translation> {
    const translation = await this.requireTranslation(translationId);
    const patch = isHumanOwned(translation)
      ? asManualTranslation(suggestedValue)
      : asAiTranslation(suggestedValue);

    return this.repository.updateTranslation(translation.id, patch);
  }

  async acceptSuggestionValue(
    translationKeyId: string,
    locale: string,
    suggestedValue: string
  ): Promise<Translation> {
    const existing = await this.repository.findTranslation(
      translationKeyId,
      locale
    );
    if (existing) {
      return this.acceptSuggestion(existing.id, suggestedValue);
    }

    await this.requireKey(translationKeyId);
    return this.repository.createTranslation({
      translationKeyId,
      locale,
      ...asAiTranslation(suggestedValue),
    });
  }

  async markReviewed(translationId: string): Promise<Translation> {
    const translation = await this.requireTranslation(translationId);
    if (!isHumanOwned(translation)) {
      return translation;
    }

    return this.repository.updateTranslation(translation.id, {
      status: 'manual',
    });
  }

  async syncFromSource(
    projectId: string,
    incoming: IncomingSourceKey[]
  ): Promise<{
    createdKeys: number;
    sourceChanges: number;
    filled: number;
    regenerated: number;
    needsReview: number;
    fillFailed: number;
  }> {
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

    for (const item of incoming) {
      const existing = await this.repository.findKeyByName(projectId, item.key);

      if (!existing) {
        const created = await this.repository.createKey({
          projectId,
          key: item.key,
          sourceText: item.sourceText,
        });
        createdKeys += 1;
        await this.repository.createTranslation({
          translationKeyId: created.id,
          locale: project.sourceLocale,
          ...asCodeTranslation(item.sourceText),
        });

        const fill = await this.fillTargetsBestEffort(
          created.id,
          targetLocales
        );
        filled += fill.filled;
        fillFailed += fill.fillFailed;
        continue;
      }

      if (existing.sourceText === item.sourceText) {
        const fill = await this.fillTargetsBestEffort(
          existing.id,
          targetLocales
        );
        filled += fill.filled;
        fillFailed += fill.fillFailed;
        continue;
      }

      sourceChanges += 1;
      try {
        const change = await this.handleSourceChange(
          existing.id,
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
    };
  }

  async fillMissingForLocale(
    projectId: string,
    locale: string
  ): Promise<{ filled: number; skipped: number }> {
    const keys = await this.repository.listKeys(projectId);
    let filled = 0;
    let skipped = 0;

    for (const key of keys) {
      const result = await this.generateMissingTranslation(key.id, locale);
      if (result.outcome === 'written') {
        filled += 1;
      } else {
        skipped += 1;
      }
    }

    return { filled, skipped };
  }

  /**
   * Rewrite selected locales from the project source text.
   * Human-owned cells are never replaced. `fromLocale` is the language the
   * source strings are actually written in, which may differ from the
   * project's configured source locale.
   */
  async retranslateLocales(
    projectId: string,
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
    let filled = 0;
    let skipped = 0;
    let failed = 0;

    for (const key of keys) {
      for (const locale of targets) {
        try {
          const result = await this.retranslateCell(
            project.sourceLocale,
            key,
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

  private async retranslateCell(
    projectSourceLocale: string,
    key: TranslationKey,
    locale: string,
    fromLocale: string
  ): Promise<AutomaticAiWriteResult> {
    const existing = await this.repository.findTranslation(key.id, locale);
    if (!canAutomaticAiWrite(existing)) {
      return {
        outcome: 'skipped',
        reason: existing?.aiLocked ? 'ai-locked' : 'human-owned',
        translation: existing ?? undefined,
      };
    }

    if (locale === fromLocale) {
      const patch =
        locale === projectSourceLocale
          ? asCodeTranslation(key.sourceText)
          : asAiTranslation(key.sourceText);
      const translation = existing
        ? await this.repository.updateTranslation(existing.id, patch)
        : await this.repository.createTranslation({
            translationKeyId: key.id,
            locale,
            ...patch,
          });
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
          locale,
          ...asAiTranslation(value),
        });
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
    locales: string[]
  ): Promise<{ filled: number; fillFailed: number }> {
    let filled = 0;
    let fillFailed = 0;

    for (const locale of locales) {
      try {
        const result = await this.generateMissingTranslation(
          translationKeyId,
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
