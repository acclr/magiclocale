export type KeyMergeMapping = {
  fromKey: string;
  toKey: string;
  sourceText?: string;
};

export type PushSourceKeysResponse = {
  createdKeys?: number;
  sourceChanges?: number;
  filled?: number;
  regenerated?: number;
  needsReview?: number;
  fillFailed?: number;
  renamedKeys?: Array<{ fromKey: string; toKey: string }>;
  mergedKeys?: KeyMergeMapping[];
  merges?: KeyMergeMapping[];
  deprecated?: string[];
  environment?: string;
};

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

export type FetchKeyMergesOptions = {
  baseUrl: string;
  projectId: string;
  token: string;
  environment?: string;
  fetch?: typeof fetch;
};

export async function pushSourceKeys(
  options: PushSourceKeysOptions
): Promise<PushSourceKeysResponse> {
  const endpoint = buildSyncEndpoint(options);
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
        return readJsonSafe(response);
      }
      const message = `Keykit sync failed (${response.status}): ${await readError(response)}`;
      if (
        response.status === 401 ||
        response.status === 403 ||
        response.status === 402 ||
        response.status === 422
      ) {
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

export async function fetchKeyMerges(
  options: FetchKeyMergesOptions
): Promise<KeyMergeMapping[]> {
  const endpoint = buildSyncEndpoint(options);
  const fetchImpl = options.fetch ?? globalThis.fetch.bind(globalThis);
  const response = await fetchImpl(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${options.token}`,
      Accept: 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(
      `Keykit merge-keys failed (${response.status}): ${await readError(response)}`
    );
  }
  const body = await readJsonSafe(response);
  return Array.isArray(body.merges) ? body.merges : [];
}

function buildSyncEndpoint(options: {
  baseUrl: string;
  projectId: string;
  environment?: string;
}): string {
  const baseUrl = options.baseUrl.replace(/\/+$/, '');
  const params = new URLSearchParams();
  if (options.environment && options.environment !== 'production') {
    params.set('environment', options.environment);
  }
  const query = params.toString();
  return (
    `${baseUrl}/api/v1/projects/${encodeURIComponent(options.projectId)}` +
    `/keys/sync${query ? `?${query}` : ''}`
  );
}

function isTerminal(error: Error): boolean {
  return /\(401\)|\(403\)|\(402\)|\(422\)/.test(error.message);
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readJsonSafe(
  response: Response
): Promise<PushSourceKeysResponse> {
  try {
    const data = (await response.json()) as PushSourceKeysResponse;
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
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
