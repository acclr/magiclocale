import { createHash } from 'crypto';

export type PublicSdkApiKey = {
  id: string;
  teamId: string;
  expiresAt: Date | null;
};

export type PublicSdkProject = {
  id: string;
  teamId: string;
};

export type PublicSdkAuthDependencies = {
  findApiKeyByHash(hashedKey: string): Promise<PublicSdkApiKey | null>;
  findProjectById(projectId: string): Promise<PublicSdkProject | null>;
  updateLastUsedAt(apiKeyId: string, lastUsedAt: Date): Promise<void>;
};

export class PublicSdkAuthError extends Error {
  constructor(
    readonly status: 401 | 404,
    message: string
  ) {
    super(message);
    this.name = 'PublicSdkAuthError';
  }
}

export function hashPublicApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

export function extractBearerToken(
  authorization: string | string[] | undefined
): string | null {
  if (typeof authorization !== 'string') {
    return null;
  }

  const match = /^Bearer ([^\s]+)$/.exec(authorization);
  return match?.[1] ?? null;
}

export async function authenticatePublicSdkRequest(
  authorization: string | string[] | undefined,
  projectId: string,
  dependencies: PublicSdkAuthDependencies,
  now = new Date()
): Promise<{ apiKey: PublicSdkApiKey; project: PublicSdkProject }> {
  const token = extractBearerToken(authorization);
  if (!token) {
    throw new PublicSdkAuthError(401, 'Invalid API key.');
  }

  const apiKey = await dependencies.findApiKeyByHash(hashPublicApiKey(token));
  if (!apiKey || (apiKey.expiresAt && apiKey.expiresAt <= now)) {
    throw new PublicSdkAuthError(401, 'Invalid or expired API key.');
  }

  const project = await dependencies.findProjectById(projectId);
  if (!project || project.teamId !== apiKey.teamId) {
    throw new PublicSdkAuthError(404, 'Project not found.');
  }

  await dependencies.updateLastUsedAt(apiKey.id, now);
  return { apiKey, project };
}
