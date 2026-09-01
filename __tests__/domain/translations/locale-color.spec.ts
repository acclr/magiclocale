import { localeColor } from '../../../domain/translations';

describe('localeColor', () => {
  it('returns a stable hex color for a locale', () => {
    const first = localeColor('sv');
    const second = localeColor('SV');

    expect(first.hex).toMatch(/^#[0-9a-f]{6}$/);
    expect(first).toEqual(second);
  });

  it('gives different colors to common locale codes', () => {
    const colors = ['en', 'sv', 'de', 'fr', 'es', 'ja'].map(
      (locale) => localeColor(locale).hex
    );

    expect(new Set(colors).size).toBe(colors.length);
  });
});
