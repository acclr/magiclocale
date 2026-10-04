export class KeykitHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'KeykitHttpError';
    this.status = status;
  }
}

export function isSourceKeyLimitError(error: unknown): error is KeykitHttpError {
  return (
    error instanceof KeykitHttpError &&
    error.status === 402 &&
    error.message.includes('Keykit ingest failed')
  );
}
