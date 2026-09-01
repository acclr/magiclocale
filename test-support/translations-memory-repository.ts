import type {
  CreateProjectInput,
  Project,
  ProjectRepository,
  Translation,
  TranslationKey,
  TranslationRepository,
  UpdateProjectInput,
} from '../domain/translations';

export type StoreState = {
  projects: Project[];
  keys: TranslationKey[];
  translations: Translation[];
};

export class MemoryRepository
  implements ProjectRepository, TranslationRepository
{
  private sequence = 0;

  constructor(private readonly state: StoreState) {}

  async getProject(id: string): Promise<Project | null> {
    return this.state.projects.find((project) => project.id === id) ?? null;
  }

  async listProjectsByTeam(teamId: string): Promise<Project[]> {
    return this.state.projects.filter((project) => project.teamId === teamId);
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const project = { id: this.id('project'), ...input };
    this.state.projects.push(project);
    return project;
  }

  async updateProject(id: string, patch: UpdateProjectInput): Promise<Project> {
    const project = this.requireProject(id);
    Object.assign(project, patch);
    return project;
  }

  async deleteProject(id: string): Promise<void> {
    const index = this.state.projects.findIndex((project) => project.id === id);
    if (index < 0) {
      throw new Error(`Project not found: ${id}`);
    }
    this.state.projects.splice(index, 1);
  }

  async addLocale(projectId: string, locale: string): Promise<Project> {
    const project = this.requireProject(projectId);
    if (!project.locales.includes(locale)) {
      project.locales.push(locale);
    }
    return project;
  }

  async removeLocale(projectId: string, locale: string): Promise<Project> {
    const project = this.requireProject(projectId);
    project.locales = project.locales.filter((item) => item !== locale);
    return project;
  }

  async listKeys(projectId: string): Promise<TranslationKey[]> {
    return this.state.keys.filter((key) => key.projectId === projectId);
  }

  async getKey(id: string): Promise<TranslationKey | null> {
    return this.state.keys.find((key) => key.id === id) ?? null;
  }

  async findKeyByName(
    projectId: string,
    key: string
  ): Promise<TranslationKey | null> {
    return (
      this.state.keys.find(
        (item) => item.projectId === projectId && item.key === key
      ) ?? null
    );
  }

  async createKey(input: Omit<TranslationKey, 'id'>): Promise<TranslationKey> {
    const key = { id: this.id('key'), ...input };
    this.state.keys.push(key);
    return key;
  }

  async updateKeySourceText(
    id: string,
    sourceText: string
  ): Promise<TranslationKey> {
    const key = this.state.keys.find((item) => item.id === id);
    if (!key) {
      throw new Error(`Translation key not found: ${id}`);
    }
    key.sourceText = sourceText;
    return key;
  }

  async listTranslations(projectId: string): Promise<Translation[]> {
    const keyIds = new Set(
      this.state.keys
        .filter((key) => key.projectId === projectId)
        .map((key) => key.id)
    );
    return this.state.translations.filter((item) =>
      keyIds.has(item.translationKeyId)
    );
  }

  async listTranslationsForKey(
    translationKeyId: string
  ): Promise<Translation[]> {
    return this.state.translations.filter(
      (item) => item.translationKeyId === translationKeyId
    );
  }

  async findTranslation(
    translationKeyId: string,
    locale: string
  ): Promise<Translation | null> {
    return (
      this.state.translations.find(
        (item) =>
          item.translationKeyId === translationKeyId && item.locale === locale
      ) ?? null
    );
  }

  async getTranslation(id: string): Promise<Translation | null> {
    return this.state.translations.find((item) => item.id === id) ?? null;
  }

  async createTranslation(
    input: Omit<Translation, 'id' | 'updatedAt'>
  ): Promise<Translation> {
    const translation = {
      id: this.id('translation'),
      ...input,
      updatedAt: new Date(),
    };
    this.state.translations.push(translation);
    return translation;
  }

  async updateTranslation(
    id: string,
    patch: Partial<
      Pick<Translation, 'value' | 'source' | 'aiLocked' | 'status'>
    >
  ): Promise<Translation> {
    const translation = this.state.translations.find((item) => item.id === id);
    if (!translation) {
      throw new Error(`Translation not found: ${id}`);
    }
    Object.assign(translation, patch, { updatedAt: new Date() });
    return translation;
  }

  private requireProject(id: string): Project {
    const project = this.state.projects.find((item) => item.id === id);
    if (!project) {
      throw new Error(`Project not found: ${id}`);
    }
    return project;
  }

  private id(prefix: string): string {
    this.sequence += 1;
    return `${prefix}_${this.sequence}`;
  }
}
