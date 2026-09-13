import {
  Prisma,
  PrismaClient,
  type Environment as PrismaEnvironment,
} from '@prisma/client';

import type { EnvironmentRepository } from '../../domain/environments/repository';
import type {
  CreateEnvironmentInput,
  Environment,
  UpdateEnvironmentInput,
} from '../../domain/environments/types';
import { prisma } from '../../lib/prisma';

function toEnvironment(environment: PrismaEnvironment): Environment {
  return {
    id: environment.id,
    projectId: environment.projectId,
    slug: environment.slug,
    name: environment.name,
    isProduction: environment.isProduction,
    liveVersionId: environment.liveVersionId,
  };
}

export class PrismaEnvironmentRepository implements EnvironmentRepository {
  constructor(private readonly client: PrismaClient = prisma) {}

  async getEnvironment(id: string): Promise<Environment | null> {
    const environment = await this.client.environment.findUnique({
      where: { id },
    });
    return environment ? toEnvironment(environment) : null;
  }

  async listEnvironments(projectId: string): Promise<Environment[]> {
    const environments = await this.client.environment.findMany({
      where: { projectId },
      orderBy: [{ isProduction: 'desc' }, { createdAt: 'asc' }],
    });
    return environments.map(toEnvironment);
  }

  async findEnvironmentBySlug(
    projectId: string,
    slug: string
  ): Promise<Environment | null> {
    const environment = await this.client.environment.findUnique({
      where: { projectId_slug: { projectId, slug } },
    });
    return environment ? toEnvironment(environment) : null;
  }

  async findProductionEnvironment(
    projectId: string
  ): Promise<Environment | null> {
    const environment = await this.client.environment.findFirst({
      where: { projectId, isProduction: true },
      orderBy: { createdAt: 'asc' },
    });
    return environment ? toEnvironment(environment) : null;
  }

  async createEnvironment(
    input: CreateEnvironmentInput
  ): Promise<Environment> {
    try {
      const environment = await this.client.environment.create({
        data: {
          projectId: input.projectId,
          slug: input.slug,
          name: input.name,
          isProduction: input.isProduction ?? false,
        },
      });
      return toEnvironment(environment);
    } catch (error) {
      // Concurrent auto-healing of a missing production environment races on
      // the (projectId, slug) unique index. Treat the winner as the result.
      if (
        !(error instanceof Prisma.PrismaClientKnownRequestError) ||
        error.code !== 'P2002'
      ) {
        throw error;
      }

      const existing = await this.findEnvironmentBySlug(
        input.projectId,
        input.slug
      );
      if (!existing) {
        throw error;
      }
      return existing;
    }
  }

  async updateEnvironment(
    id: string,
    patch: UpdateEnvironmentInput
  ): Promise<Environment> {
    const environment = await this.client.environment.update({
      where: { id },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.liveVersionId !== undefined
          ? { liveVersionId: patch.liveVersionId }
          : {}),
      },
    });
    return toEnvironment(environment);
  }

  async deleteEnvironment(id: string): Promise<void> {
    // Clear the live pointer first so the self-referencing FK does not block
    // the cascade from Environment to its versions.
    await this.client.environment.update({
      where: { id },
      data: { liveVersionId: null },
    });
    await this.client.environment.delete({ where: { id } });
  }
}
