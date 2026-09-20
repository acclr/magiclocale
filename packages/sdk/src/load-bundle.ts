import { resolveConfig } from './config';
import { HttpSourceKeyTransport } from './transport';
import type { KeykitConfig, TranslationBundle } from './types';

export async function loadTranslationBundle(
  config: KeykitConfig,
  locale: string
): Promise<TranslationBundle> {
  return new HttpSourceKeyTransport(resolveConfig(config)).pull(locale);
}
