import type { IncomingSourceKey } from '../../domain/translations';

export const MAX_KEYS_PER_BATCH = 100;
const MAX_KEY_LENGTH = 200;
const MAX_SOURCE_TEXT_LENGTH = 10_000;

export type SourceKeyPayloadResult =
  | { success: true; keys: IncomingSourceKey[] }
  | { success: false; error: string };

export function parseSourceKeyPayload(input: unknown): SourceKeyPayloadResult {
  if (!isRecord(input) || !Array.isArray(input.keys)) {
    return { success: false, error: 'Body must contain a keys array.' };
  }

  if (input.keys.length === 0) {
    return { success: false, error: 'At least one key is required.' };
  }

  if (input.keys.length > MAX_KEYS_PER_BATCH) {
    return {
      success: false,
      error: `A batch may contain at most ${MAX_KEYS_PER_BATCH} keys.`,
    };
  }

  const deduplicated = new Map<string, IncomingSourceKey>();

  for (const item of input.keys) {
    if (!isRecord(item)) {
      return { success: false, error: 'Every key entry must be an object.' };
    }

    if (typeof item.key !== 'string' || item.key.trim().length === 0) {
      return { success: false, error: 'Every key must be a non-empty string.' };
    }

    if (item.key.length > MAX_KEY_LENGTH) {
      return {
        success: false,
        error: `Keys may not exceed ${MAX_KEY_LENGTH} characters.`,
      };
    }

    if (
      typeof item.sourceText !== 'string' ||
      item.sourceText.trim().length === 0
    ) {
      return {
        success: false,
        error: 'Every sourceText must be a non-empty string.',
      };
    }

    if (item.sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
      return {
        success: false,
        error: `Source text may not exceed ${MAX_SOURCE_TEXT_LENGTH} characters.`,
      };
    }

    const key = item.key.trim();
    deduplicated.set(key, { key, sourceText: item.sourceText });
  }

  return { success: true, keys: Array.from(deduplicated.values()) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
