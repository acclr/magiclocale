type CacheEntry = {
  expiresAt: number;
  value: unknown;
};

export type TtlCache = {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  deletePrefix(prefix: string): void;
};

export function createTtlCache(maxEntries = 200): TtlCache {
  const store = new Map<string, CacheEntry>();

  return {
    get<T>(key: string): T | undefined {
      const entry = store.get(key);
      if (!entry) {
        return undefined;
      }
      if (entry.expiresAt <= Date.now()) {
        store.delete(key);
        return undefined;
      }
      return entry.value as T;
    },
    set<T>(key: string, value: T, ttlMs: number): void {
      if (store.size >= maxEntries) {
        const oldest = store.keys().next().value;
        if (oldest) {
          store.delete(oldest);
        }
      }
      store.set(key, { expiresAt: Date.now() + ttlMs, value });
    },
    deletePrefix(prefix: string): void {
      for (const key of Array.from(store.keys())) {
        if (key.startsWith(prefix)) {
          store.delete(key);
        }
      }
    },
  };
}
