import {
  createLandingSdkConfig,
  parseLandingLocale,
} from '../../lib/landing-locale';

describe('landing locale helpers', () => {
  it('uses the cookie only when it is a configured project locale', () => {
    expect(parseLandingLocale('sv', ['en', 'sv'], 'en')).toBe('sv');
    expect(parseLandingLocale('de', ['en', 'sv'], 'en')).toBe('en');
    expect(parseLandingLocale(undefined, ['en', 'sv'], 'sv')).toBe('sv');
  });

  it('builds SDK config only when the landing project is fully configured', () => {
    expect(
      createLandingSdkConfig({
        appUrl: 'http://localhost:4002/',
        projectId: 'project_a',
        ingestToken: 'token_a',
        sourceLocale: 'en',
      })
    ).toEqual({
      baseUrl: 'http://localhost:4002',
      projectId: 'project_a',
      ingestToken: 'token_a',
      sourceLocale: 'en',
      refreshIntervalMs: 30_000,
    });
    expect(
      createLandingSdkConfig({
        appUrl: 'http://localhost:4002',
        projectId: '',
        ingestToken: 'token_a',
      })
    ).toBeNull();
  });
});
