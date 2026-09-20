const DEFAULT_ALLOWED_ORIGIN = 'http://localhost:3001';

export type PublicSdkCorsPolicy = {
  allowedOrigins: string[];
};

export function getPublicSdkCorsPolicy(): PublicSdkCorsPolicy {
  return {
    allowedOrigins: uniqueOrigins([
      process.env.KEYKIT_ALLOWED_ORIGIN ?? DEFAULT_ALLOWED_ORIGIN,
      process.env.APP_URL,
    ]),
  };
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
