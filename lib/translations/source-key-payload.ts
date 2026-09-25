import type { IncomingSourceKey } from '../../domain/translations';
import type { KeyType } from '../../domain/keys';

export const MAX_KEYS_PER_BATCH = 100;
const MAX_KEY_LENGTH = 200;
const MAX_SOURCE_TEXT_LENGTH = 10_000;
const MAX_FILE_LENGTH = 500;

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

    const type = parseType(item.type);
    const sourceText =
      typeof item.sourceText === 'string' ? item.sourceText : '';

    if (type === 'translation') {
      if (sourceText.trim().length === 0) {
        return {
          success: false,
          error: 'Every sourceText must be a non-empty string.',
        };
      }
      if (sourceText.length > MAX_SOURCE_TEXT_LENGTH) {
        return {
          success: false,
          error: `Source text may not exceed ${MAX_SOURCE_TEXT_LENGTH} characters.`,
        };
      }
    }

    const usage = parseUsage(item.usage);
    const key = item.key.trim();
    deduplicated.set(`${type}:${key}`, {
      key,
      sourceText: type === 'translation' ? sourceText : sourceText || key,
      type,
      usage,
    });
  }

  return { success: true, keys: Array.from(deduplicated.values()) };
}

function parseType(value: unknown): KeyType {
  if (value === 'feature-flag' || value === 'flag' || value === 'featureFlag') {
    return 'feature-flag';
  }
  return 'translation';
}

function parseUsage(value: unknown): IncomingSourceKey['usage'] {
  if (
    !isRecord(value) ||
    typeof value.file !== 'string' ||
    !value.file.trim()
  ) {
    return null;
  }
  if (value.file.length > MAX_FILE_LENGTH) {
    return null;
  }
  const line = typeof value.line === 'number' ? value.line : Number(value.line);
  if (!Number.isInteger(line) || line < 0) {
    return null;
  }
  const column =
    typeof value.column === 'number'
      ? value.column
      : value.column === undefined
        ? null
        : Number(value.column);
  return {
    file: value.file.trim(),
    line,
    column: Number.isInteger(column) ? column : null,
    repository: typeof value.repository === 'string' ? value.repository : null,
    branch: typeof value.branch === 'string' ? value.branch : null,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
