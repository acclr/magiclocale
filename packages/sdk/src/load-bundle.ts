import { resolveConfig } from './config';
import { HttpSourceKeyTransport } from './transport';
import type { LocaleKitConfig, TranslationBundle } from './types';

export async function loadTranslationBundle(
  config: LocaleKitConfig,
  locale: string
): Promise<TranslationBundle> {
  return new HttpSourceKeyTransport(resolveConfig(config)).pull(locale);
}
