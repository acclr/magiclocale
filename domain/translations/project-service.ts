import type { ProjectRepository } from './repository';
import type { LocaleCode, Project } from './types';

export type CreateTeamProjectInput = {
  name: string;
  sourceLocale: LocaleCode;
  locales?: LocaleCode[];
  billingScope?: Project['billingScope'];
};

export class ProjectService {
  constructor(private readonly repository: ProjectRepository) {}

  list(teamId: string): Promise<Project[]> {
    return this.repository.listProjectsByTeam(
      this.requireValue(teamId, 'Team')
    );
  }

  async get(teamId: string, projectId: string): Promise<Project> {
    return this.requireTeamProject(teamId, projectId);
  }

  async create(
    teamId: string,
    input: CreateTeamProjectInput
  ): Promise<Project> {
    const normalizedTeamId = this.requireValue(teamId, 'Team');
    const name = this.requireValue(input.name, 'Project name');
    const sourceLocale = this.requireValue(input.sourceLocale, 'Source locale');
    const locales = this.uniqueLocales([
      sourceLocale,
      ...(input.locales ?? []),
    ]);

    return this.repository.createProject({
      teamId: normalizedTeamId,
      name,
      sourceLocale,
      locales,
      billingScope: input.billingScope ?? 'team',
    });
  }

  async setBillingScope(
    teamId: string,
    projectId: string,
    billingScope: Project['billingScope']
  ): Promise<Project> {
    const project = await this.requireTeamProject(teamId, projectId);
    if (project.billingScope === billingScope) {
      return project;
    }
    return this.repository.updateProject(project.id, { billingScope });
  }

  async rename(
    teamId: string,
    projectId: string,
    name: string
  ): Promise<Project> {
    const project = await this.requireTeamProject(teamId, projectId);
    return this.repository.updateProject(project.id, {
      name: this.requireValue(name, 'Project name'),
    });
  }

  async delete(teamId: string, projectId: string): Promise<void> {
    const project = await this.requireTeamProject(teamId, projectId);
    await this.repository.deleteProject(project.id);
  }

  async addLocale(
    teamId: string,
    projectId: string,
    locale: LocaleCode
  ): Promise<Project> {
    const project = await this.requireTeamProject(teamId, projectId);
    const normalizedLocale = this.requireValue(locale, 'Locale');
    if (project.locales.includes(normalizedLocale)) {
      return project;
    }

    return this.repository.addLocale(project.id, normalizedLocale);
  }

  async removeLocale(
    teamId: string,
    projectId: string,
    locale: LocaleCode
  ): Promise<Project> {
    const project = await this.requireTeamProject(teamId, projectId);
    const normalizedLocale = this.requireValue(locale, 'Locale');
    if (normalizedLocale === project.sourceLocale) {
      throw new Error('The source locale cannot be removed');
    }
    if (!project.locales.includes(normalizedLocale)) {
      return project;
    }

    return this.repository.removeLocale(project.id, normalizedLocale);
  }

  private async requireTeamProject(
    teamId: string,
    projectId: string
  ): Promise<Project> {
    const normalizedTeamId = this.requireValue(teamId, 'Team');
    const normalizedProjectId = this.requireValue(projectId, 'Project');
    const project = await this.repository.getProject(normalizedProjectId);
    if (!project || project.teamId !== normalizedTeamId) {
      throw new Error(`Project not found: ${normalizedProjectId}`);
    }
    return project;
  }

  private requireValue(value: string, label: string): string {
    const normalized = value.trim();
    if (!normalized) {
      throw new Error(`${label} is required`);
    }
    return normalized;
  }

  private uniqueLocales(locales: LocaleCode[]): LocaleCode[] {
    return Array.from(
      new Set(locales.map((locale) => this.requireValue(locale, 'Locale')))
    );
  }
}
