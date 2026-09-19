import type { MigrationOperationInput } from '../migrations/types';
import type { KeyMeta } from '../keys/types';
import type { ArchitectureFinding } from './types';

export function cleanupOperationsForFinding(
  finding: Pick<ArchitectureFinding, 'kind'>,
  meta: KeyMeta
): MigrationOperationInput | null {
  if (finding.kind === 'unused-key' || finding.kind === 'unknown-flag') {
    return {
      type: 'archive-key',
      keyType: meta.type,
      fromKey: meta.key,
    };
  }
  if (
    finding.kind === 'stale-flag' ||
    finding.kind === 'temporary-flag-overdue'
  ) {
    return {
      type: 'deprecate-key',
      keyType: meta.type,
      fromKey: meta.key,
    };
  }
  return null;
}
