export const MAX_ALLOWED_ORIGINS = 50;

export class AllowedOriginError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AllowedOriginError';
  }
}

/**
 * Normalize a customer-entered origin to `scheme://host[:port]`.
 * Paths, credentials, and fragments are rejected so CORS matches browsers.
 */
export function parseAllowedOrigin(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new AllowedOriginError(
      'Enter a full origin such as https://app.example.com'
    );
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new AllowedOriginError(
      'Enter a full origin such as https://app.example.com'
    );
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AllowedOriginError('Origins must use http or https.');
  }
  if (url.username || url.password) {
    throw new AllowedOriginError('Origins cannot include credentials.');
  }
  if ((url.pathname && url.pathname !== '/') || url.search || url.hash) {
    throw new AllowedOriginError(
      'Enter the origin only, without a path, query, or fragment.'
    );
  }
  if (!url.host) {
    throw new AllowedOriginError('Origin is missing a host.');
  }

  return `${url.protocol}//${url.host}`;
}

export function parseAllowedOrigins(values: string[]): string[] {
  if (values.length > MAX_ALLOWED_ORIGINS) {
    throw new AllowedOriginError(
      `A project can have at most ${MAX_ALLOWED_ORIGINS} allowed origins.`
    );
  }

  const origins: string[] = [];
  for (const value of values) {
    const origin = parseAllowedOrigin(value);
    if (!origins.includes(origin)) {
      origins.push(origin);
    }
  }
  return origins;
}
