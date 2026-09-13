import type {
  CreateEnvironmentInput,
  Environment,
  UpdateEnvironmentInput,
} from './types';

export interface EnvironmentReader {
  getEnvironment(id: string): Promise<Environment | null>;
  listEnvironments(projectId: string): Promise<Environment[]>;
  findEnvironmentBySlug(
    projectId: string,
    slug: string
  ): Promise<Environment | null>;
  findProductionEnvironment(projectId: string): Promise<Environment | null>;
}

export interface EnvironmentRepository extends EnvironmentReader {
  createEnvironment(input: CreateEnvironmentInput): Promise<Environment>;
  updateEnvironment(
    id: string,
    patch: UpdateEnvironmentInput
  ): Promise<Environment>;
  deleteEnvironment(id: string): Promise<void>;
}
