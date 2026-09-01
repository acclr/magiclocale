import {
  corsHeaders,
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
