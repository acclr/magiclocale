import 'server-only';

import { createTtlCache } from '@/lib/cache/ttl-cache';

import { rememberApiKeyUse, touchApiKeyIfStale } from './api-key-touch';
import { prisma } from '../prisma';
import {
  authenticatePublicSdkRequest,
  type PublicSdkApiKey,
  type PublicSdkAuthDependencies,
  type PublicSdkProject,
} from './public-sdk-auth';

const AUTH_CACHE_TTL_MS = 60_000;
const apiKeyCache = createTtlCache();
const projectCache = createTtlCache();

const prismaPublicSdkAuthDependencies: PublicSdkAuthDependencies = {
  async findApiKeyByHash(hashedKey) {
    const cached = apiKeyCache.get<PublicSdkApiKey>(hashedKey);
    if (cached) {
      return cached;
    }

    const row = await prisma.apiKey.findUnique({
      where: { hashedKey },
      select: {
        id: true,
        teamId: true,
        expiresAt: true,
        projectId: true,
        environmentId: true,
        lastUsedAt: true,
      },
    });
    if (!row) {
      return null;
    }

    rememberApiKeyUse(row.id, row.lastUsedAt);
    const apiKey: PublicSdkApiKey = {
      id: row.id,
      teamId: row.teamId,
      expiresAt: row.expiresAt,
      projectId: row.projectId,
      environmentId: row.environmentId,
    };
    apiKeyCache.set(hashedKey, apiKey, AUTH_CACHE_TTL_MS);
    return apiKey;
  },
  async findProjectById(projectId) {
    const cached = projectCache.get<PublicSdkProject>(projectId);
    if (cached) {
      return cached;
    }

    const project = await prisma.translationProject.findUnique({
      where: { id: projectId },
      select: { id: true, teamId: true },
    });
    if (project) {
      projectCache.set(projectId, project, AUTH_CACHE_TTL_MS);
    }
    return project;
  },
  async updateLastUsedAt(apiKeyId, lastUsedAt) {
    await touchApiKeyIfStale(apiKeyId, lastUsedAt);
  },
};

export function authenticatePublicSdkApiRequest(
  authorization: string | string[] | undefined,
  projectId: string,
  requestedEnvironment?: string | null
) {
  return authenticatePublicSdkRequest(
    authorization,
    projectId,
    prismaPublicSdkAuthDependencies,
    requestedEnvironment
  );
}
