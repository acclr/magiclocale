type SourceKeyLimitListener = (message: string) => void;

let latestNotice: string | null = null;
const listeners = new Set<SourceKeyLimitListener>();

export function sourceKeyLimitNotice(error: Error): string | null {
  const status =
    'status' in error && typeof error.status === 'number' ? error.status : null;
  const isIngestLimit =
    status === 402 && error.message.includes('Keykit ingest failed');
  if (!isIngestLimit && !/source key limit/i.test(error.message)) {
    return null;
  }
  return error.message.replace(/^Keykit ingest failed \(\d+\):\s*/, '');
}

export function publishSourceKeyLimit(message: string): void {
  latestNotice = message;
  for (const listener of Array.from(listeners)) {
    listener(message);
  }
}

export function subscribeSourceKeyLimit(
  listener: SourceKeyLimitListener
): () => void {
  listeners.add(listener);
  if (latestNotice) {
    listener(latestNotice);
  }
  return () => {
    listeners.delete(listener);
  };
}
