import type { ReactNode } from 'react';
import { interpolate, type TranslationValues } from './interpolate';

export type { TranslationValues } from './interpolate';

type PrimitiveTranslationValues = Record<string, string | number>;

export type TranslateFn = {
  (key: string, defaultText: string): string;
  (
    key: string,
    defaultText: string,
    values: PrimitiveTranslationValues
  ): string;
  (key: string, defaultText: string, values: TranslationValues): ReactNode;
};

export type KeykitTranslateApi = {
  t: {
    (key: string, defaultText?: string): string;
    (
      key: string,
      defaultText: string,
      values: PrimitiveTranslationValues
    ): string;
    (key: string, defaultText: string, values: TranslationValues): ReactNode;
  };
  translate: TranslateFn;
  locale: string;
  isLoading: boolean;
  setLocale: (locale: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function createTranslateApi(input: {
  locale: string;
  /** Catalog lookup only. Placeholder values are applied here. */
  translate: (key: string, defaultText: string) => string;
  sourceCatalog?: Record<string, string>;
  isLoading?: boolean;
  setLocale?: (locale: string) => Promise<void>;
  refresh?: () => Promise<void>;
}): KeykitTranslateApi {
  const sourceCatalog = input.sourceCatalog;
  const lookup = input.translate;

  const translate = ((
    key: string,
    defaultText: string,
    values?: TranslationValues
  ) => interpolate(lookup(key, defaultText), values)) as TranslateFn;

  const t = ((
    key: string,
    defaultText?: string,
    values?: TranslationValues
  ) => {
    const sourceText =
      (defaultText !== undefined && defaultText !== ''
        ? defaultText
        : sourceCatalog?.[key]) ?? key;
    return values === undefined
      ? translate(key, sourceText)
      : translate(key, sourceText, values);
  }) as KeykitTranslateApi['t'];

  return {
    t,
    translate,
    locale: input.locale,
    isLoading: input.isLoading ?? false,
    setLocale:
      input.setLocale ??
      (async () => {
        throw new Error(
          'setLocale() is available in Client Components that render under KeykitProvider.'
        );
      }),
    refresh: input.refresh ?? (async () => undefined),
  };
}
