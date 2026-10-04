import { createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { createTranslateApi } from './translate-api';
import { interpolate } from './interpolate';

describe('createTranslateApi', () => {
  it('uses the source catalog when the default text is omitted', () => {
    const translate = vi.fn(
      (key: string, source: string) => `${key}:${source}`
    );
    const { t } = createTranslateApi({
      locale: 'sv',
      translate,
      sourceCatalog: { 'settings.save': 'Save changes' },
    });

    expect(t('settings.save')).toBe('settings.save:Save changes');
    expect(t('settings.save', 'Save')).toBe('settings.save:Save');
    expect(t('missing')).toBe('missing:missing');
  });

  it('fills string slots and leaves unknown slots in place', () => {
    const { t } = createTranslateApi({
      locale: 'sv',
      translate: (_key, source) =>
        source === 'Start with editing the {fileName} file'
          ? 'Börja med att redigera {fileName}'
          : source,
    });

    expect(
      t('home.heading', 'Start with editing the {fileName} file', {
        fileName: 'page.tsx',
      })
    ).toBe('Börja med att redigera page.tsx');
    expect(
      t('home.heading', 'Start with editing the {fileName} file', {})
    ).toBe('Börja med att redigera {fileName}');
  });
});

describe('interpolate', () => {
  it('renders a JSX slot where the placeholder sits', () => {
    const code = createElement('code', null, 'page.tsx');
    const english = interpolate('Start with editing the {fileName} file', {
      fileName: code,
    });
    const swedish = interpolate('Börja med att redigera {fileName}', {
      fileName: code,
    });

    const slot = expect.objectContaining({
      type: 'code',
      props: expect.objectContaining({ children: 'page.tsx' }),
    });
    expect(english).toEqual(['Start with editing the ', slot, ' file']);
    expect(swedish).toEqual(['Börja med att redigera ', slot]);
  });

  it('still replaces {{name}} placeholders', () => {
    expect(interpolate('Hello {{name}}', { name: 'Ada' })).toBe('Hello Ada');
  });
});
