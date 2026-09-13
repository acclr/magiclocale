import { createHash } from 'crypto';

export type PublicSdkApiKey = {
  id: string;
  teamId: string;
  expiresAt: Date | null;
  /** Set when the key may only ever be used against one project. */
  projectId: string | null;
  /** Set when the key may only ever read one environment. */
  environmentId: string | null;
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
    readonly status: 401 | 403 | 404,
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

export type PublicSdkAuthResult = {
  apiKey: PublicSdkApiKey;
  project: PublicSdkProject;
  /**
   * Environment the request must operate on, or null to let the caller fall
   * back to production. A bound key always wins over the requested value, so
   * a staging key can never read production by changing a query parameter.
   */
  environmentRef: string | null;
};

export async function authenticatePublicSdkRequest(
  authorization: string | string[] | undefined,
  projectId: string,
  dependencies: PublicSdkAuthDependencies,
  requestedEnvironment?: string | null,
  now = new Date()
): Promise<PublicSdkAuthResult> {
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
  if (apiKey.projectId && apiKey.projectId !== project.id) {
    throw new PublicSdkAuthError(404, 'Project not found.');
  }

  await dependencies.updateLastUsedAt(apiKey.id, now);

  return {
    apiKey,
    project,
    environmentRef: resolveEnvironmentRef(apiKey, requestedEnvironment),
  };
}

/**
 * A key bound to an environment ignores whatever the client asked for. An
 * unbound key may target any environment in its own project, which keeps
 * existing single-key setups working.
 */
export function resolveEnvironmentRef(
  apiKey: Pick<PublicSdkApiKey, 'environmentId'>,
  requestedEnvironment?: string | null
): string | null {
  if (apiKey.environmentId) {
    return apiKey.environmentId;
  }
  const requested = requestedEnvironment?.trim();
  return requested ? requested : null;
}
