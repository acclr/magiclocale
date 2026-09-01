import { prisma } from '@/lib/prisma';
import { hashPublicApiKey } from '@/lib/api/public-sdk-auth';
import { randomBytes } from 'crypto';

interface CreateApiKeyParams {
  name: string;
  teamId: string;
}

export const hashApiKey = hashPublicApiKey;

const generateUniqueApiKey = () => {
  const apiKey = randomBytes(16).toString('hex');

  return [hashApiKey(apiKey), apiKey];
};

export const createApiKey = async (params: CreateApiKeyParams) => {
  const { name, teamId } = params;

  const [hashedKey, apiKey] = generateUniqueApiKey();

  await prisma.apiKey.create({
    data: {
      name,
      hashedKey: hashedKey,
      team: { connect: { id: teamId } },
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
    },
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
    },
  });
};
