import {
  getLocaleOption,
  isCatalogLocale,
  LocaleCatalogError,
  matchCatalogLocale,
  normalizeLocaleTag,
  requireCatalogLocale,
  searchLocales,
} from '../../../domain/translations';

describe('locale catalog', () => {
  it('normalizes language and regional tags', () => {
    expect(normalizeLocaleTag(' SV ')).toBe('sv');
    expect(normalizeLocaleTag('en-gb')).toBe('en-GB');
    expect(normalizeLocaleTag('nb_no')).toBe('nb-NO');
  });

  it('accepts ISO language codes and regional BCP-47 tags', () => {
    expect(requireCatalogLocale('da', 'language')).toBe('da');
    expect(requireCatalogLocale('nb', 'language')).toBe('nb');
    expect(requireCatalogLocale('nb-no', 'regional')).toBe('nb-NO');
    expect(isCatalogLocale('en-GB', 'language')).toBe(false);
    expect(isCatalogLocale('en', 'regional')).toBe(false);
    expect(isCatalogLocale('dk')).toBe(false);
    expect(isCatalogLocale('no-nb')).toBe(false);
  });

  it('rejects invented codes with a format-specific error', () => {
    expect(() => requireCatalogLocale('dk', 'language')).toThrow(
      LocaleCatalogError
    );
    expect(() => requireCatalogLocale('no-nb', 'regional')).toThrow(
      /en-GB, sv-SE, or nb-NO/
    );
  });

  it('labels languages with English, native names, and flags', () => {
    expect(getLocaleOption('sv')).toMatchObject({
      code: 'sv',
      label: 'Swedish / Svenska',
      flag: '🇸🇪',
    });
    expect(getLocaleOption('nb')).toMatchObject({
      code: 'nb',
      label: 'Norwegian / Norska (Norskt bokmål)',
      flag: '🇳🇴',
    });
    expect(getLocaleOption('nb-NO')?.label).toBe(
      'Norwegian / Norska (Norskt bokmål)'
    );
  });

  it('finds locales by code or semantic name', () => {
    expect(matchCatalogLocale('sv', 'language')?.code).toBe('sv');
    expect(
      searchLocales('bokmål', 'language').some((option) => option.code === 'nb')
    ).toBe(true);
    expect(
      searchLocales('united kingdom', 'regional').some(
        (option) => option.code === 'en-GB'
      )
    ).toBe(true);
  });
});
