import type { Translation } from './types';

/**
 * System-level invariant: once a human has touched a translation,
 * automatic AI must never replace that value.
 */
export const AI_MUST_NEVER_OVERWRITE_HUMAN_CONTENT = true as const;

export function isHumanOwned(translation: Translation): boolean {
  return translation.aiLocked || translation.source === 'manual';
}

export function isAiOwned(translation: Translation): boolean {
  return !isHumanOwned(translation);
}

/**
 * Gate for every automatic AI write path.
 * Missing translations may be created. Human-owned rows must be skipped.
 */
export function canAutomaticAiWrite(
  translation: Translation | null | undefined
): boolean {
  if (!translation) {
    return true;
  }

  return !translation.aiLocked && translation.source !== 'manual';
}

export function asManualTranslation(
  value: string
): Pick<Translation, 'value' | 'source' | 'aiLocked' | 'status'> {
  return {
    value,
    source: 'manual',
    aiLocked: true,
    status: 'manual',
  };
}

export function asAiTranslation(
  value: string
): Pick<Translation, 'value' | 'source' | 'aiLocked' | 'status'> {
  return {
    value,
    source: 'ai',
    aiLocked: false,
    status: 'ai',
  };
}

export function asCodeTranslation(
  value: string
): Pick<Translation, 'value' | 'source' | 'aiLocked' | 'status'> {
  return {
    value,
    source: 'code',
    aiLocked: false,
    status: 'source',
  };
}

export function asNeedsReview(): Pick<Translation, 'status'> {
  return { status: 'needs-review' };
}
