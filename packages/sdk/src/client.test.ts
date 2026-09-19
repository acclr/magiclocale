import { describe, expect, it, vi } from 'vitest';
import { LocaleKitClient } from './client';
import type { FetchLike } from './types';

function createClient(fetch: FetchLike, overrides = {}) {
  return new LocaleKitClient({
    baseUrl: 'http://localhost:3000/',
    projectId: 'proj_acme',
    ingestToken: 'test-token',
    debounceMs: 60_000,
    retryDelayMs: 1,
    maxRetries: 0,
    refreshIntervalMs: 0,
    fetch,
    onError: () => undefined,
    ...overrides,
  });
}

function ok(): Response {
  return new Response(JSON.stringify({ createdKeys: 1 }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('LocaleKitClient', () => {
  it('returns default text synchronously and pushes only on flush', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(ok());
    const client = createClient(fetch);
    expect(client.translate('demo.welcome', 'Welcome')).toBe('Welcome');
    expect(fetch).not.toHaveBeenCalled();

    await client.flush();
    expect(fetch.mock.calls[0]?.[0]).toBe(
      'http://localhost:3000/api/v1/projects/proj_acme/keys/sync'
    );
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      keys: [{ key: 'demo.welcome', sourceText: 'Welcome', type: 'translation' }],
    });
    client.dispose();
  });

  it('deduplicates keys and keeps the latest source text', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(ok());
    const client = createClient(fetch);
    client.translate('demo.title', 'Old title');
    client.translate('demo.title', 'New title');
    await client.flush();
    expect(JSON.parse(String(fetch.mock.calls[0]?.[1]?.body))).toEqual({
      keys: [{ key: 'demo.title', sourceText: 'New title', type: 'translation' }],
    });
    client.translate('demo.title', 'New title');
    await client.flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    client.dispose();
  });

  it('chunks large queues into bounded batches', async () => {
    const fetch = vi.fn<FetchLike>().mockResolvedValue(ok());
    const client = createClient(fetch, { batchSize: 2 });
    client.translate('demo.one', 'One');
    client.translate('demo.two', 'Two');
    client.translate('demo.three', 'Three');
    await client.flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(
      JSON.parse(String(fetch.mock.calls[0]?.[1]?.body)).keys
    ).toHaveLength(2);
    client.dispose();
  });

  it('retries failed requests and sends the authorization token', async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: 'temporary' }), { status: 503 })
      )
      .mockResolvedValueOnce(ok());
    const client = createClient(fetch, { maxRetries: 1 });
    client.translate('demo.retry', 'Try again');
    await client.flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1]?.[1]?.headers).toEqual({
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
    });
    client.dispose();
  });

  it('automatically flushes after the debounce window', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn<FetchLike>().mockResolvedValue(ok());
    const client = createClient(fetch, { debounceMs: 20 });
    client.translate('demo.automatic', 'Automatic');
    await vi.advanceTimersByTimeAsync(20);
    expect(fetch).toHaveBeenCalledTimes(1);
    client.dispose();
    vi.useRealTimers();
  });

  it('requeues a failed batch so a later flush can recover it', async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(ok());
    const client = createClient(fetch);
    client.translate('demo.offline', 'Available later');
    await expect(client.flush()).rejects.toThrow('offline');
    await client.flush();
    expect(fetch).toHaveBeenCalledTimes(2);
    client.dispose();
  });

  it('loads and refreshes locale bundles', async () => {
    const fetch = vi
      .fn<FetchLike>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            projectId: 'proj_acme',
            locale: 'sv',
            sourceLocale: 'en',
            translations: { 'demo.welcome': 'Välkommen' },
            version: 'v1',
          })
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            projectId: 'proj_acme',
            locale: 'sv',
            sourceLocale: 'en',
            translations: { 'demo.welcome': 'Varmt välkommen' },
            version: 'v2',
          })
        )
      );
    const client = createClient(fetch);
    await client.setLocale('sv');
    expect(client.translate('demo.welcome', 'Welcome')).toBe('Välkommen');
    await client.refreshTranslations();
    expect(client.translate('demo.welcome', 'Welcome')).toBe('Varmt välkommen');
    expect(fetch.mock.calls[0]?.[1]?.method).toBe('GET');
    client.dispose();
  });
});
