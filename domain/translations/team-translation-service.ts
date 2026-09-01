import {
  paginateTranslationDashboard,
  projectTranslationDashboard,
  type DashboardQuery,
  type TranslationDashboard,
} from './dashboard-projector';
import type { TranslationRepository } from './repository';
import type { ProjectService } from './project-service';
import type { TranslationService } from './translation-service';
import type { Project, Translation, TranslationKey } from './types';

export class TeamTranslationService {
  constructor(
    private readonly repository: TranslationRepository,
    private readonly projectService: ProjectService,
    private readonly translationService: TranslationService
  ) {}

  async dashboard(
    teamId: string,
    projectId: string,
    query?: Partial<DashboardQuery>
  ): Promise<TranslationDashboard> {
    const project = await this.projectService.get(teamId, projectId);
    const [keys, translations] = await Promise.all([
      this.repository.listKeys(project.id),
      this.repository.listTranslations(project.id),
    ]);
    return paginateTranslationDashboard(
      projectTranslationDashboard(project, keys, translations),
      query
    );
  }

  async saveManual(
    teamId: string,
    projectId: string,
    keyId: string,
    locale: string,
    value: string
  ): Promise<Translation> {
    await this.requireCell(teamId, projectId, keyId, locale);
    return this.translationService.saveManualValue(keyId, locale, value);
  }

  async suggest(
    teamId: string,
    projectId: string,
    keyId: string,
    locale: string
  ): Promise<string> {
    await this.requireCell(teamId, projectId, keyId, locale);
    return this.translationService.suggestTranslation(keyId, locale);
  }

  async acceptSuggestion(
    teamId: string,
    projectId: string,
    keyId: string,
    locale: string,
    value: string
  ): Promise<Translation> {
    await this.requireCell(teamId, projectId, keyId, locale);
    return this.translationService.acceptSuggestionValue(keyId, locale, value);
  }

  async markReviewed(
    teamId: string,
    projectId: string,
    translationId: string
  ): Promise<Translation> {
    await this.requireTranslation(teamId, projectId, translationId);
    return this.translationService.markReviewed(translationId);
  }

  async addLocaleAndFill(
    teamId: string,
    projectId: string,
    locale: string
  ): Promise<{ project: Project; filled: number; skipped: number }> {
    await this.projectService.get(teamId, projectId);
    const result = await this.translationService.translateNewLocale(
      projectId,
      locale
    );
    const project = await this.projectService.get(teamId, projectId);
    return { project, ...result };
  }

  async fillMissing(
    teamId: string,
    projectId: string,
    locale: string
  ): Promise<{ filled: number; skipped: number }> {
    const project = await this.projectService.get(teamId, projectId);
    this.requireProjectLocale(project, locale);
    return this.translationService.fillMissingForLocale(project.id, locale);
  }

  async retranslate(
    teamId: string,
    projectId: string,
    locales: string[],
    sourceLocale?: string
  ): Promise<{ filled: number; skipped: number; failed: number }> {
    const project = await this.projectService.get(teamId, projectId);
    for (const locale of locales) {
      this.requireProjectLocale(project, locale);
    }
    return this.translationService.retranslateLocales(
      project.id,
      locales,
      sourceLocale
    );
  }

  private async requireCell(
    teamId: string,
    projectId: string,
    keyId: string,
    locale: string
  ): Promise<{ project: Project; key: TranslationKey }> {
    const project = await this.projectService.get(teamId, projectId);
    this.requireProjectLocale(project, locale);
    const key = await this.repository.getKey(keyId);
    if (!key || key.projectId !== project.id) {
      throw new Error(`Translation key not found: ${keyId}`);
    }
    return { project, key };
  }

  private async requireTranslation(
    teamId: string,
    projectId: string,
    translationId: string
  ): Promise<Translation> {
    await this.projectService.get(teamId, projectId);
    const translation = await this.repository.getTranslation(translationId);
    if (!translation) {
      throw new Error(`Translation not found: ${translationId}`);
    }
    const key = await this.repository.getKey(translation.translationKeyId);
    if (!key || key.projectId !== projectId) {
      throw new Error(`Translation not found: ${translationId}`);
    }
    return translation;
  }

  private requireProjectLocale(project: Project, locale: string): void {
    if (!project.locales.includes(locale)) {
      throw new Error(`Locale not found in project: ${locale}`);
    }
  }
}
