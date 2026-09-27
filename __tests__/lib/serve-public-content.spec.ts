import {
  asTranslationMap,
  etagMatches,
} from '../../lib/api/public-content-codec';

describe('public content reads', () => {
  it('keeps only string values from a published JSON bundle', () => {
    expect(
      asTranslationMap({
        save: 'Save',
        count: 2,
        nested: { a: 'b' },
      })
    ).toEqual({ save: 'Save' });
    expect(asTranslationMap('{"save":"Save"}')).toEqual({ save: 'Save' });
    expect(asTranslationMap(null)).toEqual({});
  });

  it('matches a strong or weak etag', () => {
    const etag = '"production:4:sv"';
    expect(etagMatches(etag, etag)).toBe(true);
    expect(etagMatches(`W/${etag}`, etag)).toBe(true);
    expect(etagMatches('"production:3:sv"', etag)).toBe(false);
    expect(etagMatches(undefined, etag)).toBe(false);
  });
});
