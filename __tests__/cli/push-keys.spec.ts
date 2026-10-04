import { pushSourceKeys } from '../../packages/cli/src/push-keys';

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: async () => body,
  } as Response;
}

describe('pushSourceKeys', () => {
  it('posts one batch and does not retry a successful response', async () => {
    const fetch = jest.fn(async () => jsonResponse(200, { createdKeys: 1 }));

    await pushSourceKeys({
      baseUrl: 'https://www.keykit.dev/',
      projectId: 'proj_acme',
      token: 'kk_test',
      keys: [{ key: 'home.title', sourceText: 'Welcome', type: 'translation' }],
      fetch: fetch as unknown as typeof globalThis.fetch,
      retryDelayMs: 1,
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]?.[0]).toBe(
      'https://www.keykit.dev/api/v1/projects/proj_acme/keys/sync'
    );
    expect(fetch.mock.calls[0]?.[1]).toMatchObject({
      method: 'POST',
      headers: { Authorization: 'Bearer kk_test' },
    });
  });

  it('stops immediately on auth failures', async () => {
    const fetch = jest.fn(async () => jsonResponse(403, { error: 'Forbidden' }));

    await expect(
      pushSourceKeys({
        baseUrl: 'https://www.keykit.dev',
        projectId: 'proj_acme',
        token: 'kk_test',
        keys: [{ key: 'home.title', sourceText: 'Welcome' }],
        fetch: fetch as unknown as typeof globalThis.fetch,
        maxRetries: 2,
        retryDelayMs: 1,
      })
    ).rejects.toThrow(/403/);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
