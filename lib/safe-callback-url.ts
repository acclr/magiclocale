import { isPublicHomePath } from './path-glob';

/**
 * Resolve a NextAuth-style callbackUrl to a same-app path.
 * Absolute URLs are reduced to path+search; locale-only prefixes become `/`.
 */
export function safeCallbackPath(raw: unknown): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }

  let decoded = value;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    decoded = value;
  }

  let pathWithSearch: string;
  if (/^https?:\/\//i.test(decoded)) {
    try {
      const url = new URL(decoded);
      pathWithSearch = `${url.pathname}${url.search}`;
    } catch {
      return null;
    }
  } else {
    pathWithSearch = decoded;
  }

  if (!pathWithSearch.startsWith('/') || pathWithSearch.startsWith('//')) {
    return null;
  }

  if (pathWithSearch.includes('\\')) {
    return null;
  }

  const pathOnly = pathWithSearch.split('?')[0] || '/';
  if (isPublicHomePath(pathOnly)) {
    return '/';
  }

  return pathWithSearch;
}
