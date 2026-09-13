import common from '../locales/en/common.json';

const sourceCatalog = common as Record<string, string>;

export type DashboardTranslateOptions = {
  defaultValue?: string;
  count?: number;
  [key: string]: unknown;
};

export function resolveDashboardSourceText(
  key: string,
  options?: DashboardTranslateOptions | string
): string {
  if (typeof options === 'string' && options.trim()) {
    return options;
  }

  if (options && typeof options === 'object') {
    if (
      typeof options.defaultValue === 'string' &&
      options.defaultValue.trim()
    ) {
      return options.defaultValue;
    }

    if (typeof options.count === 'number' && options.count !== 1) {
      const plural = sourceCatalog[`${key}_plural`];
      if (plural) {
        return plural;
      }
    }
  }

  return sourceCatalog[key] || key;
}

export function interpolateDashboardText(
  template: string,
  options?: DashboardTranslateOptions | string
): string {
  if (!options || typeof options === 'string') {
    return template;
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, name: string) => {
    const value = options[name];
    return value == null || typeof value === 'object' ? match : String(value);
  });
}

export function translateDashboardKey(
  key: string,
  options: DashboardTranslateOptions | string | undefined,
  translate?: (key: string, defaultText: string) => string
): string {
  const sourceText = resolveDashboardSourceText(key, options);
  const translated = translate ? translate(key, sourceText) : sourceText;
  return interpolateDashboardText(translated, options);
}
