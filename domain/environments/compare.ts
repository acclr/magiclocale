import type { Environment } from './types';
import type { FlagWithConfig } from '../flags/types';
import type { Translation, TranslationKey } from '../translations/types';

export type FlagCompareRow = {
  key: string;
  left: { enabled: boolean; inherited: boolean } | null;
  right: { enabled: boolean; inherited: boolean } | null;
};

export type TranslationCompareRow = {
  key: string;
  locale: string;
  left: string | null;
  right: string | null;
};

export type EnvironmentComparison = {
  left: Environment;
  right: Environment;
  flags: FlagCompareRow[];
  translations: TranslationCompareRow[];
};

export function compareEnvironments(input: {
  left: Environment;
  right: Environment;
  leftFlags: FlagWithConfig[];
  rightFlags: FlagWithConfig[];
  keys: TranslationKey[];
  leftTranslations: Translation[];
  rightTranslations: Translation[];
}): EnvironmentComparison {
  const flagKeys = new Set([
    ...input.leftFlags.map((item) => item.flag.key),
    ...input.rightFlags.map((item) => item.flag.key),
  ]);
  const leftFlag = new Map(
    input.leftFlags.map((item) => [item.flag.key, item])
  );
  const rightFlag = new Map(
    input.rightFlags.map((item) => [item.flag.key, item])
  );
  const flags: FlagCompareRow[] = Array.from(flagKeys)
    .sort()
    .map((key) => {
      const left = leftFlag.get(key);
      const right = rightFlag.get(key);
      return {
        key,
        left: left
          ? { enabled: left.config.enabled, inherited: left.config.inherited }
          : null,
        right: right
          ? {
              enabled: right.config.enabled,
              inherited: right.config.inherited,
            }
          : null,
      };
    })
    .filter((row) => JSON.stringify(row.left) !== JSON.stringify(row.right));

  const leftCells = new Map(
    input.leftTranslations.map((item) => [
      `${item.translationKeyId}:${item.locale}`,
      item.value,
    ])
  );
  const rightCells = new Map(
    input.rightTranslations.map((item) => [
      `${item.translationKeyId}:${item.locale}`,
      item.value,
    ])
  );
  const translations: TranslationCompareRow[] = [];
  for (const key of input.keys) {
    const locales = new Set([
      ...input.leftTranslations
        .filter((item) => item.translationKeyId === key.id)
        .map((item) => item.locale),
      ...input.rightTranslations
        .filter((item) => item.translationKeyId === key.id)
        .map((item) => item.locale),
    ]);
    for (const locale of Array.from(locales)) {
      const left = leftCells.get(`${key.id}:${locale}`) ?? null;
      const right = rightCells.get(`${key.id}:${locale}`) ?? null;
      if (left !== right) {
        translations.push({ key: key.key, locale, left, right });
      }
    }
  }

  return {
    left: input.left,
    right: input.right,
    flags,
    translations,
  };
}
