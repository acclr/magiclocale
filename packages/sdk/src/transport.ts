import type {
  FlagPayload,
  ResolvedKeykitConfig,
  SourceKey,
  TranslationBundle,
} from './types';

export interface SourceKeyTransport {
  push(keys: SourceKey[], keepalive?: boolean): Promise<void>;
}

export interface KeykitTransport extends SourceKeyTransport {
  pull(locale: string): Promise<TranslationBundle>;
  pullFlags?(): Promise<FlagPayload>;
}

export class HttpSourceKeyTransport implements KeykitTransport {
  constructor(private readonly config: ResolvedKeykitConfig) {}

  async push(keys: SourceKey[], keepalive = false): Promise<void> {
    const endpoint =
      `${this.config.baseUrl}/api/v1/projects/` +
      `${encodeURIComponent(this.config.projectId)}/keys/sync` +
      this.environmentQuery(true);
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
        `Keykit ingest failed (${response.status}): ${await readError(
          response
        )}`
      );
    }
  }

  async pull(locale: string): Promise<TranslationBundle> {
    const endpoint =
      `${this.config.baseUrl}/api/v1/projects/` +
      `${encodeURIComponent(this.config.projectId)}/translations?locale=` +
      encodeURIComponent(locale) +
      this.environmentQuery(false);
    const response = await this.config.fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.config.ingestToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Keykit translation refresh failed (${
          response.status
        }): ${await readError(response)}`
      );
    }

    return (await response.json()) as TranslationBundle;
  }

  async pullFlags(): Promise<FlagPayload> {
    const endpoint =
      `${this.config.baseUrl}/api/v1/projects/` +
      `${encodeURIComponent(this.config.projectId)}/flags` +
      this.environmentQuery(true);
    const response = await this.config.fetch(endpoint, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.config.ingestToken}` },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(
        `Keykit flag refresh failed (${
          response.status
        }): ${await readError(response)}`
      );
    }

    return (await response.json()) as FlagPayload;
  }

  private environmentQuery(leadingQuestion: boolean): string {
    const parts: string[] = [];
    if (this.config.environment && this.config.environment !== 'production') {
      parts.push(`environment=${encodeURIComponent(this.config.environment)}`);
    }
    if (this.config.version !== null) {
      parts.push(`version=${encodeURIComponent(String(this.config.version))}`);
    }
    if (!parts.length) {
      return '';
    }
    return `${leadingQuestion ? '?' : '&'}${parts.join('&')}`;
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
