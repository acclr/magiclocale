import { describe, expect, it } from 'vitest';

import { createKeykit } from './create-keykit';

describe('createKeykit', () => {
  it('reads the API key, project, and host from the environment', () => {
    expect(
      createKeykit({
        env: {
          KEYKIT_API_KEY: 'kk_live',
          KEYKIT_PROJECT_ID: 'prj_1',
          KEYKIT_BASE_URL: 'https://www.keykit.dev/',
          KEYKIT_SOURCE_LOCALE: 'en',
        },
      }).config
    ).toMatchObject({
      baseUrl: 'https://www.keykit.dev',
      projectId: 'prj_1',
      ingestToken: 'kk_live',
      sourceLocale: 'en',
    });
  });

  it('falls back to NEXT_PUBLIC variables and the hosted default URL', () => {
    expect(
      createKeykit({
        env: {
          NEXT_PUBLIC_KEYKIT_API_KEY: 'kk_public',
          NEXT_PUBLIC_KEYKIT_PROJECT_ID: 'prj_public',
        },
      }).config
    ).toMatchObject({
      baseUrl: 'https://www.keykit.dev',
      projectId: 'prj_public',
      ingestToken: 'kk_public',
      sourceLocale: 'en',
    });
  });

  it('lets explicit options override the environment, including an empty host', () => {
    expect(
      createKeykit({
        apiKey: 'override',
        projectId: 'prj_override',
        baseUrl: '',
        sourceLocale: 'sv',
        env: {
          KEYKIT_API_KEY: 'from-env',
          KEYKIT_PROJECT_ID: 'from-env',
          KEYKIT_BASE_URL: 'https://example.com',
        },
      }).config
    ).toMatchObject({
      baseUrl: '',
      projectId: 'prj_override',
      ingestToken: 'override',
      sourceLocale: 'sv',
    });
  });
});
