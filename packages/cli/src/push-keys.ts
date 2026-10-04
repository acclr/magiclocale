export type PushSourceKeysOptions = {
  baseUrl: string;
  projectId: string;
  token: string;
  environment?: string;
  keys: unknown[];
  /** Previously synced keys that a full project scan no longer finds. */
  removed?: readonly string[];
  fetch?: typeof fetch;
  maxRetries?: number;
  retryDelayMs?: number;
};

export async function pushSourceKeys(options: PushSourceKeysOptions): Promise<void> {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (options.environment && options.environment !== 'production') {
    params.set('environment', options.environment);
  }
  const query = params.toString();
  const endpoint =
    `${baseUrl}/api/v1/projects/${encodeURIComponent(options.projectId)}` +
    `/keys/sync${query ? `?${query}` : ''}`;
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const maxRetries = options.maxRetries ?? 2;
  const retryDelayMs = options.retryDelayMs ?? 300;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${options.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keys: options.keys,
          ...(options.removed && options.removed.length > 0
            ? { removed: options.removed }
            : {}),
        }),
      });
      if (response.ok) {
        return;
      }
      const message = `Keykit sync failed (${response.status}): ${await readError(response)}`;
      if (response.status === 401 || response.status === 403 || response.status === 402 || response.status === 422) {
        throw new Error(message);
      }
      lastError = new Error(message);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (isTerminal(lastError) || attempt >= maxRetries) {
        break;
      }
    }
    await delay(retryDelayMs * 2 ** attempt);
  }

  throw lastError ?? new Error('Keykit sync failed.');
}

function isTerminal(error: Error): boolean {
  return /\(401\)|\(403\)|\(402\)|\(422\)/.test(error.message);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown };
    if (typeof body.error === 'string') {
      return body.error;
    }
  } catch {
    // Fall through to status text for non-JSON responses.
  }
  return response.statusText || 'Unknown error';
}
