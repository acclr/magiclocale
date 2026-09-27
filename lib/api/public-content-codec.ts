export function etagMatches(header: string | undefined, etag: string): boolean {
  if (!header) {
    return false;
  }
  return header.split(',').some((part) => {
    const value = part.trim().replace(/^W\//, '');
    return value === etag;
  });
}

export function asTranslationMap(value: unknown): Record<string, string> {
  const source = typeof value === 'string' ? parseJson(value) : value;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return {};
  }
  const translations: Record<string, string> = {};
  for (const [key, item] of Object.entries(source)) {
    if (typeof item === 'string') {
      translations[key] = item;
    }
  }
  return translations;
}

function parseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}
