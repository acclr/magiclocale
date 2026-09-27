import { prisma } from '@/lib/prisma';

/** Successful reads rewrite `lastUsedAt` at most this often. */
export const API_KEY_TOUCH_INTERVAL_MS = 15 * 60 * 1000;

const touchedAt = new Map<string, number>();

export function rememberApiKeyUse(
  apiKeyId: string,
  lastUsedAt: Date | null | undefined
): void {
  if (lastUsedAt) {
    touchedAt.set(apiKeyId, lastUsedAt.getTime());
  }
}

export async function touchApiKeyIfStale(
  apiKeyId: string,
  now = new Date()
): Promise<void> {
  const previous = touchedAt.get(apiKeyId) ?? 0;
  if (now.getTime() - previous < API_KEY_TOUCH_INTERVAL_MS) {
    return;
  }

  await prisma.apiKey.update({
    where: { id: apiKeyId },
    data: { lastUsedAt: now },
  });
  touchedAt.set(apiKeyId, now.getTime());
}
