import { resolveConfig } from './config';
import { HttpSourceKeyTransport } from './transport';
import type { MagicLocaleConfig, TranslationBundle } from './types';

export async function loadTranslationBundle(
  config: MagicLocaleConfig,
  locale: string
): Promise<TranslationBundle> {
  return new HttpSourceKeyTransport(resolveConfig(config)).pull(locale);
}
