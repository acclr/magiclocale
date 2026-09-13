import 'server-only';

import { prisma } from '../prisma';
import {
  authenticatePublicSdkRequest,
  type PublicSdkAuthDependencies,
} from './public-sdk-auth';

const prismaPublicSdkAuthDependencies: PublicSdkAuthDependencies = {
  async findApiKeyByHash(hashedKey) {
    return prisma.apiKey.findUnique({
      where: { hashedKey },
      select: {
        id: true,
        teamId: true,
        expiresAt: true,
        projectId: true,
        environmentId: true,
      },
    });
  },
  async findProjectById(projectId) {
    return prisma.translationProject.findUnique({
      where: { id: projectId },
      select: { id: true, teamId: true },
    });
  },
  async updateLastUsedAt(apiKeyId, lastUsedAt) {
    await prisma.apiKey.update({
      where: { id: apiKeyId },
      data: { lastUsedAt },
    });
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
