import type { FlagSetSnapshot, FlagSnapshot } from '@/domain/flags';

/**
 * Strip flags that must not be evaluated in a browser.
 *
 * A `server-only` flag's rules may reference user attributes such as email
 * addresses, so shipping its ruleset to the client would leak them. Clients
 * see nothing about these flags and use the evaluate endpoint instead.
 */
export function toPublicFlagPayload(snapshot: FlagSetSnapshot): FlagSnapshot[] {
  return snapshot.flags.filter((flag) => flag.visibility === 'public');
}

export function findFlag(
  snapshot: FlagSetSnapshot,
  key: string
): FlagSnapshot | null {
  return snapshot.flags.find((flag) => flag.key === key) ?? null;
}
