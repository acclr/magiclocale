const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:4002';
const CORS_CACHE_TTL_MS = 30_000;

export type PublicSdkCorsPolicy = {
  allowedOrigins: string[];
};

type CachedOrigins = {
  origins: string[];
  expiresAt: number;
};

const projectOriginCache = new Map<string, CachedOrigins>();

export function getHostAllowedOrigins(): string[] {
  return uniqueOrigins([
    process.env.KEYKIT_ALLOWED_ORIGIN ?? DEFAULT_ALLOWED_ORIGIN,
    DEFAULT_ALLOWED_ORIGIN,
    process.env.APP_URL,
  ]);
}

/** Host-level allowlist only. Prefer getPublicSdkCorsPolicyForProject. */
export function getPublicSdkCorsPolicy(): PublicSdkCorsPolicy {
  return { allowedOrigins: getHostAllowedOrigins() };
}

export function uniqueOrigins(values: Array<string | undefined>): string[] {
  const origins: string[] = [];

  for (const value of values) {
    for (const part of (value ?? '').split(',')) {
      const origin = part.trim().replace(/\/+$/, '');
      if (origin && !origins.includes(origin)) {
        origins.push(origin);
      }
    }
  }

  return origins;
}

export function isAllowedOrigin(
  origin: string | null,
  policy: PublicSdkCorsPolicy
): boolean {
  return origin === null || policy.allowedOrigins.includes(origin);
}

export function corsHeaders(
  origin: string | null,
  policy: PublicSdkCorsPolicy
): Record<string, string> {
  const headers: Record<string, string> = { Vary: 'Origin' };

  if (origin && policy.allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
    headers['Access-Control-Max-Age'] = '600';
  }

  return headers;
}

export function invalidateProjectCorsCache(projectId: string): void {
  projectOriginCache.delete(projectId);
}

export function clearPublicSdkCorsCache(): void {
  projectOriginCache.clear();
}

export async function getPublicSdkCorsPolicyForProject(
  projectId: string | null,
  loadProjectOrigins: (projectId: string) => Promise<string[]>
): Promise<PublicSdkCorsPolicy> {
  const hostOrigins = getHostAllowedOrigins();
  if (!projectId) {
    return { allowedOrigins: hostOrigins };
  }

  const now = Date.now();
  const cached = projectOriginCache.get(projectId);
  let projectOrigins: string[];
  if (cached && cached.expiresAt > now) {
    projectOrigins = cached.origins;
  } else {
    projectOrigins = await loadProjectOrigins(projectId);
    projectOriginCache.set(projectId, {
      origins: projectOrigins,
      expiresAt: now + CORS_CACHE_TTL_MS,
    });
  }

  return {
    allowedOrigins: uniqueOrigins([...hostOrigins, ...projectOrigins]),
  };
}
