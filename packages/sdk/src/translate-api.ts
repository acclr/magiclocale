export type KeykitTranslateApi = {
  t: (key: string, defaultText?: string) => string;
  translate: (key: string, defaultText: string) => string;
  locale: string;
  isLoading: boolean;
  setLocale: (locale: string) => Promise<void>;
  refresh: () => Promise<void>;
};

export function createTranslateApi(input: {
  locale: string;
  translate: (key: string, defaultText: string) => string;
  sourceCatalog?: Record<string, string>;
  isLoading?: boolean;
  setLocale?: (locale: string) => Promise<void>;
  refresh?: () => Promise<void>;
}): KeykitTranslateApi {
  const sourceCatalog = input.sourceCatalog;
  const translate = input.translate;

  const t = (key: string, defaultText?: string) => {
    const sourceText =
      (defaultText !== undefined && defaultText !== ''
        ? defaultText
        : sourceCatalog?.[key]) ?? key;
    return translate(key, sourceText);
  };

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
