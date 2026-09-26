import { describe, expect, it, vi } from 'vitest';
import { createTranslateApi } from './translate-api';

describe('createTranslateApi', () => {
  it('uses the source catalog when the default text is omitted', () => {
    const translate = vi.fn((key: string, source: string) => `${key}:${source}`);
    const { t } = createTranslateApi({
      locale: 'sv',
      translate,
      sourceCatalog: { 'settings.save': 'Save changes' },
    });

    expect(t('settings.save')).toBe('settings.save:Save changes');
    expect(t('settings.save', 'Save')).toBe('settings.save:Save');
    expect(t('missing')).toBe('missing:missing');
  });
});