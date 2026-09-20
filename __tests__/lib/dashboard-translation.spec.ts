import {
  interpolateDashboardText,
  resolveDashboardSourceText,
  translateDashboardKey,
} from '../../lib/dashboard-translation';

describe('dashboard translation helpers', () => {
  it('uses common.json, then an explicit default, then the key itself', () => {
    expect(resolveDashboardSourceText('back-to-projects')).toBe(
      'Back to projects'
    );
    expect(resolveDashboardSourceText('missing-key', 'Fallback copy')).toBe(
      'Fallback copy'
    );
    expect(resolveDashboardSourceText('missing-key')).toBe('missing-key');
  });

  it('uses the plural catalog entry when count is not 1', () => {
    expect(
      resolveDashboardSourceText('unpublished-changes', { count: 1 })
    ).toBe('{{count}} unpublished change');
    expect(
      resolveDashboardSourceText('unpublished-changes', { count: 3 })
    ).toBe('{{count}} unpublished changes');
  });

  it('interpolates values and registers the source key with Keykit', () => {
    const seen: Array<[string, string]> = [];
    expect(
      translateDashboardKey(
        'page-of',
        { page: 2, pages: 5 },
        (key, defaultText) => {
          seen.push([key, defaultText]);
          return defaultText;
        }
      )
    ).toBe('Page 2 of 5');
    expect(seen).toEqual([['page-of', 'Page {{page}} of {{pages}}']]);
    expect(interpolateDashboardText('Hello {{name}}', { name: 'Ada' })).toBe(
      'Hello Ada'
    );
  });
});
