import {
  authenticatePublicSdkRequest,
  extractBearerToken,
  hashPublicApiKey,
  PublicSdkAuthError,
  type PublicSdkAuthDependencies,
} from '../../lib/api/public-sdk-auth';

const NOW = new Date('2026-08-31T10:00:00.000Z');

function dependencies(
  overrides: Partial<PublicSdkAuthDependencies> = {}
): PublicSdkAuthDependencies {
  return {
    findApiKeyByHash: jest.fn().mockResolvedValue({
      id: 'key_a',
      teamId: 'team_a',
      expiresAt: null,
    }),
    findProjectById: jest.fn().mockResolvedValue({
      id: 'project_a',
      teamId: 'team_a',
    }),
    updateLastUsedAt: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('public SDK API authentication', () => {
  it('parses only an exact bearer authorization value', () => {
    expect(extractBearerToken('Bearer secret')).toBe('secret');
    expect(extractBearerToken('bearer secret')).toBeNull();
    expect(extractBearerToken('Bearer secret extra')).toBeNull();
    expect(extractBearerToken(undefined)).toBeNull();
  });

  it('uses the same SHA-256 storage format as generated team API keys', () => {
    expect(hashPublicApiKey('test-api-key')).toBe(
      '4c806362b613f7496abf284146efd31da90e4b16169fe001841ca17290f427c4'
    );
  });

  it('accepts a valid key and records successful use', async () => {
    const deps = dependencies();

    await expect(
      authenticatePublicSdkRequest(
        'Bearer test-api-key',
        'project_a',
        deps,
        NOW
      )
    ).resolves.toMatchObject({
      apiKey: { id: 'key_a', teamId: 'team_a' },
      project: { id: 'project_a', teamId: 'team_a' },
    });
    expect(deps.findApiKeyByHash).toHaveBeenCalledWith(
      hashPublicApiKey('test-api-key')
    );
    expect(deps.updateLastUsedAt).toHaveBeenCalledWith('key_a', NOW);
  });

  it('rejects missing, unknown, and expired keys without recording use', async () => {
    for (const findApiKeyByHash of [
      jest.fn().mockResolvedValue(null),
      jest.fn().mockResolvedValue({
        id: 'key_a',
        teamId: 'team_a',
        expiresAt: new Date('2026-08-31T09:59:59.000Z'),
      }),
    ]) {
      const deps = dependencies({ findApiKeyByHash });
      await expect(
        authenticatePublicSdkRequest(
          'Bearer test-api-key',
          'project_a',
          deps,
          NOW
        )
      ).rejects.toEqual(
        expect.objectContaining<Partial<PublicSdkAuthError>>({ status: 401 })
      );
      expect(deps.findProjectById).not.toHaveBeenCalled();
      expect(deps.updateLastUsedAt).not.toHaveBeenCalled();
    }
  });

  it('hides another tenant project and never authorizes service access', async () => {
    const deps = dependencies({
      findProjectById: jest.fn().mockResolvedValue({
        id: 'project_b',
        teamId: 'team_b',
      }),
    });

    await expect(
      authenticatePublicSdkRequest(
        'Bearer test-api-key',
        'project_b',
        deps,
        NOW
      )
    ).rejects.toEqual(
      expect.objectContaining<Partial<PublicSdkAuthError>>({
        status: 404,
        message: 'Project not found.',
      })
    );
    expect(deps.updateLastUsedAt).not.toHaveBeenCalled();
  });
});
