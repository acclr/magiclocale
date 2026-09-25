import {
  clearPublicSdkCorsCache,
  corsHeaders,
  getPublicSdkCorsPolicyForProject,
  invalidateProjectCorsCache,
  isAllowedOrigin,
  uniqueOrigins,
  type PublicSdkCorsPolicy,
} from '../../lib/api/public-sdk-cors';
import { isPublicSdkApiPath } from '../../lib/api/public-sdk-paths';

const policy: PublicSdkCorsPolicy = {
  allowedOrigins: ['http://localhost:3001', 'http://localhost:4002'],
};

describe('public SDK CORS policy', () => {
  it('allows server requests and any configured browser origin', () => {
    expect(isAllowedOrigin(null, policy)).toBe(true);
    expect(isAllowedOrigin('http://localhost:3001', policy)).toBe(true);
    expect(isAllowedOrigin('http://localhost:4002', policy)).toBe(true);
    expect(isAllowedOrigin('http://localhost:4000', policy)).toBe(false);
    expect(corsHeaders('http://localhost:4002', policy)).toMatchObject({
      'Access-Control-Allow-Origin': 'http://localhost:4002',
      'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    });
  });

  it('merges host origins with cached per-project origins', async () => {
    clearPublicSdkCorsCache();
    const load = jest.fn(async () => ['https://app.example.com']);

    const first = await getPublicSdkCorsPolicyForProject('project_a', load);
    const second = await getPublicSdkCorsPolicyForProject('project_a', load);

    expect(first.allowedOrigins).toEqual(
      expect.arrayContaining(['https://app.example.com'])
    );
    expect(second.allowedOrigins).toEqual(first.allowedOrigins);
    expect(load).toHaveBeenCalledTimes(1);

    invalidateProjectCorsCache('project_a');
    await getPublicSdkCorsPolicyForProject('project_a', load);
    expect(load).toHaveBeenCalledTimes(2);
    clearPublicSdkCorsCache();
  });

  it('includes the app origin so this host can consume its own SDK API', () => {
    expect(
      uniqueOrigins(['http://localhost:3001', 'http://localhost:4002/'])
    ).toEqual(['http://localhost:3001', 'http://localhost:4002']);
    expect(
      uniqueOrigins(['http://localhost:3001, http://localhost:4002'])
    ).toEqual(['http://localhost:3001', 'http://localhost:4002']);
  });
});

describe('public SDK middleware paths', () => {
  it.each([
    '/api/v1/projects/project_a/keys/sync',
    '/api/v1/projects/project_a/translations',
    '/api/v1/projects/project_a/flags',
    '/api/v1/projects/project_a/flags/evaluate',
  ])('bypasses NextAuth for the exact public endpoint %s', (pathname) => {
    expect(isPublicSdkApiPath(pathname)).toBe(true);
  });

  it.each([
    '/api/v1/projects/project_a',
    '/api/v1/projects/project_a/keys',
    '/api/v1/projects/project_a/translations/extra',
    '/api/v1/projects/team/project_a/translations',
  ])('does not bypass NextAuth for %s', (pathname) => {
    expect(isPublicSdkApiPath(pathname)).toBe(false);
  });
});
