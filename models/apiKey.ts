import { prisma } from '@/lib/prisma';
import { hashPublicApiKey } from '@/lib/api/public-sdk-auth';
import { randomBytes } from 'crypto';

interface CreateApiKeyParams {
  name: string;
  teamId: string;
  /** Optional scoping so a key can only read one project/environment. */
  projectId?: string | null;
  environmentId?: string | null;
}

export const hashApiKey = hashPublicApiKey;

const generateUniqueApiKey = () => {
  const apiKey = randomBytes(16).toString('hex');

  return [hashApiKey(apiKey), apiKey];
};

export const createApiKey = async (params: CreateApiKeyParams) => {
  const { name, teamId, projectId, environmentId } = params;

  const [hashedKey, apiKey] = generateUniqueApiKey();

  await prisma.apiKey.create({
    data: {
      name,
      hashedKey,
      team: { connect: { id: teamId } },
      ...(projectId ? { projectId } : {}),
      ...(environmentId
        ? { environment: { connect: { id: environmentId } } }
        : {}),
    },
  });

  return apiKey;
};

export const fetchApiKeys = async (teamId: string) => {
  return prisma.apiKey.findMany({
    where: {
      teamId,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastUsedAt: true,
      projectId: true,
      environmentId: true,
      environment: {
        select: {
          id: true,
          slug: true,
          name: true,
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const deleteApiKey = async (id: string) => {
  return prisma.apiKey.delete({
    where: {
      id,
    },
  });
};

export const getApiKey = async (apiKey: string) => {
  return prisma.apiKey.findUnique({
    where: {
      hashedKey: hashApiKey(apiKey),
    },
    select: {
      id: true,
      teamId: true,
      projectId: true,
      environmentId: true,
    },
  });
};

export const getApiKeyById = async (id: string) => {
  return prisma.apiKey.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      teamId: true,
      projectId: true,
      environmentId: true,
    },
  });
};
