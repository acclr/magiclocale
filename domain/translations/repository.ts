import type {
  CreateProjectInput,
  Project,
  Translation,
  TranslationKey,
  UpdateProjectInput,
} from './types';

export interface ProjectReader {
  getProject(id: string): Promise<Project | null>;
}

export interface ProjectLocaleRepository extends ProjectReader {
  addLocale(projectId: string, locale: string): Promise<Project>;
}

export interface ProjectRepository extends ProjectLocaleRepository {
  listProjectsByTeam(teamId: string): Promise<Project[]>;
  createProject(input: CreateProjectInput): Promise<Project>;
  updateProject(id: string, patch: UpdateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  removeLocale(projectId: string, locale: string): Promise<Project>;
}

export interface TranslationRepository extends ProjectLocaleRepository {
  listKeys(projectId: string): Promise<TranslationKey[]>;
  getKey(id: string): Promise<TranslationKey | null>;
  findKeyByName(projectId: string, key: string): Promise<TranslationKey | null>;
  createKey(input: Omit<TranslationKey, 'id'>): Promise<TranslationKey>;
  updateKeySourceText(id: string, sourceText: string): Promise<TranslationKey>;

  listTranslations(projectId: string): Promise<Translation[]>;
  listTranslationsForKey(translationKeyId: string): Promise<Translation[]>;
  findTranslation(
    translationKeyId: string,
    locale: string
  ): Promise<Translation | null>;
  getTranslation(id: string): Promise<Translation | null>;
  createTranslation(
    input: Omit<Translation, 'id' | 'updatedAt'>
  ): Promise<Translation>;
  updateTranslation(
    id: string,
    patch: Partial<
      Pick<Translation, 'value' | 'source' | 'aiLocked' | 'status'>
    >
  ): Promise<Translation>;
}
