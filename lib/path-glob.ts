/**
 * Minimal glob matcher for Edge middleware. Supports exact paths, a single
 * path segment (`*`), and nested suffixes (`**`).
 */
export function isGlobMatch(pathname: string, patterns: readonly string[]) {
  return patterns.some((pattern) => matchGlobPattern(pathname, pattern));
}

export function matchGlobPattern(pathname: string, pattern: string) {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  }

  if (pattern.endsWith('/*')) {
    const prefix = pattern.slice(0, -2);
    if (!pathname.startsWith(`${prefix}/`)) {
      return false;
    }
    const rest = pathname.slice(prefix.length + 1);
    return rest.length > 0 && !rest.includes('/');
  }

  return pathname === pattern;
}
