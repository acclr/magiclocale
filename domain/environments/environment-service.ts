import type { ProjectService } from '../translations/project-service';
import type { EnvironmentRepository } from './repository';
import {
  MAX_ENVIRONMENTS_PER_PROJECT,
  PRODUCTION_ENVIRONMENT_SLUG,
  type Environment,
} from './types';

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

export class EnvironmentLimitError extends Error {
  constructor(readonly limit: number) {
    super(
      `A project may have at most ${limit} environments. ` +
        'Delete an environment before adding another.'
    );
    this.name = 'EnvironmentLimitError';
  }
}

export class EnvironmentService {
  constructor(
    private readonly repository: EnvironmentRepository,
    private readonly projectService: ProjectService
  ) {}

  async list(teamId: string, projectId: string): Promise<Environment[]> {
    const project = await this.projectService.get(teamId, projectId);
    return this.listForProject(project.id);
  }

  /**
   * Every project needs a production environment. Projects created before
   * environments existed, and freshly created ones, are healed here so no
   * caller has to special-case a project without environments.
   */
  async listForProject(projectId: string): Promise<Environment[]> {
    const environments = await this.repository.listEnvironments(projectId);
    if (environments.length > 0) {
      return environments;
    }

    await this.ensureProduction(projectId);
    return this.repository.listEnvironments(projectId);
  }

  async ensureProduction(projectId: string): Promise<Environment> {
    const existing = await this.repository.findProductionEnvironment(projectId);
    if (existing) {
      return existing;
    }

    return this.repository.createEnvironment({
      projectId,
      slug: PRODUCTION_ENVIRONMENT_SLUG,
      name: 'Production',
      isProduction: true,
    });
  }

  async get(
    teamId: string,
    projectId: string,
    environmentId: string
  ): Promise<Environment> {
    const project = await this.projectService.get(teamId, projectId);
    return this.requireProjectEnvironment(project.id, environmentId);
  }

  /**
   * Accepts either an environment id or a slug so URLs and SDK callers can
   * use the readable `?env=staging` form. Falls back to production.
   */
  async resolve(
    projectId: string,
    slugOrId?: string | null
  ): Promise<Environment> {
    const identifier = slugOrId?.trim();
    if (!identifier) {
      return this.ensureProduction(projectId);
    }

    const bySlug = await this.repository.findEnvironmentBySlug(
      projectId,
      identifier.toLowerCase()
    );
    if (bySlug) {
      return bySlug;
    }

    const byId = await this.repository.getEnvironment(identifier);
    if (byId && byId.projectId === projectId) {
      return byId;
    }

    throw new Error(`Environment not found: ${identifier}`);
  }

  async create(
    teamId: string,
    projectId: string,
    input: { slug: string; name?: string; parentEnvironmentId?: string | null }
  ): Promise<Environment> {
    const project = await this.projectService.get(teamId, projectId);
    const slug = this.requireSlug(input.slug);
    const existing = await this.listForProject(project.id);

    if (existing.length >= MAX_ENVIRONMENTS_PER_PROJECT) {
      throw new EnvironmentLimitError(MAX_ENVIRONMENTS_PER_PROJECT);
    }
    if (existing.some((environment) => environment.slug === slug)) {
      throw new Error(`Environment already exists: ${slug}`);
    }

    return this.repository.createEnvironment({
      projectId: project.id,
      slug,
      name: input.name?.trim() || this.titleCase(slug),
      isProduction: false,
      parentEnvironmentId: input.parentEnvironmentId ?? null,
    });
  }

  async setParent(
    teamId: string,
    projectId: string,
    environmentId: string,
    parentEnvironmentId: string | null
  ): Promise<Environment> {
    const environment = await this.get(teamId, projectId, environmentId);
    if (parentEnvironmentId) {
      if (parentEnvironmentId === environment.id) {
        throw new Error('An environment cannot be its own parent');
      }
      const parent = await this.requireProjectEnvironment(
        environment.projectId,
        parentEnvironmentId
      );
      await this.assertNoCycle(environment.id, parent.id);
    }
    return this.repository.updateEnvironment(environment.id, {
      parentEnvironmentId,
    });
  }

  async rename(
    teamId: string,
    projectId: string,
    environmentId: string,
    name: string
  ): Promise<Environment> {
    const environment = await this.get(teamId, projectId, environmentId);
    const normalized = name.trim();
    if (!normalized) {
      throw new Error('Environment name is required');
    }
    return this.repository.updateEnvironment(environment.id, {
      name: normalized,
    });
  }

  async delete(
    teamId: string,
    projectId: string,
    environmentId: string
  ): Promise<void> {
    const environment = await this.get(teamId, projectId, environmentId);
    if (environment.isProduction) {
      throw new Error('The production environment cannot be deleted');
    }
    await this.repository.deleteEnvironment(environment.id);
  }

  async requireProjectEnvironment(
    projectId: string,
    environmentId: string
  ): Promise<Environment> {
    const environment = await this.repository.getEnvironment(environmentId);
    if (!environment || environment.projectId !== projectId) {
      throw new Error(`Environment not found: ${environmentId}`);
    }
    return environment;
  }

  private async assertNoCycle(
    environmentId: string,
    proposedParentId: string
  ): Promise<void> {
    const visited = new Set<string>([environmentId]);
    let current: string | null = proposedParentId;
    while (current) {
      if (visited.has(current)) {
        throw new Error('Environment parent links cannot form a cycle');
      }
      visited.add(current);
      const node = await this.repository.getEnvironment(current);
      current = node?.parentEnvironmentId ?? null;
    }
  }

  private requireSlug(slug: string): string {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) {
      throw new Error('Environment slug is required');
    }
    if (!SLUG_PATTERN.test(normalized)) {
      throw new Error(
        'Environment slug may only contain lowercase letters, numbers, ' +
          'and dashes'
      );
    }
    if (normalized === PRODUCTION_ENVIRONMENT_SLUG) {
      throw new Error('The production environment already exists');
    }
    return normalized;
  }

  private titleCase(slug: string): string {
    return slug
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }
}
