import type {
  ResolvedMagicLocaleConfig,
  SourceKey,
  TranslationBundle,
} from './types';

export interface SourceKeyTransport {
  push(keys: SourceKey[], keepalive?: boolean): Promise<void>;
}

export interface MagicLocaleTransport extends SourceKeyTransport {
  pull(locale: string): Promise<TranslationBundle>;
}

export class HttpSourceKeyTransport implements MagicLocaleTransport {
  constructor(private readonly config: ResolvedMagicLocaleConfig) {}

  async push(keys: SourceKey[], keepalive = false): Promise<void> {
    const endpoint =
      `${this.config.baseUrl}/api/v1/projects/` +
      `${encodeURIComponent(this.config.projectId)}/keys/sync`;
    const response = await this.config.fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.ingestToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ keys }),
      keepalive,
    });

    if (!response.ok) {
      throw new Error(
        `MagicLocale ingest failed (${response.status}): ${await readError(
          response
        )}`
      );
    }
  }

  async pull(locale: string): Promise<TranslationBundle> {
    const endpoint =
      `${this.config.baseUrl}/api/v1/projects/` +
      `${encodeURIComponent(this.config.projectId)}/translations?locale=` +
      encodeURIComponent(locale);
    const response = await this.config.fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.config.ingestToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `MagicLocale translation refresh failed (${
          response.status
        }): ${await readError(response)}`
      );
    }

    return (await response.json()) as TranslationBundle;
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
