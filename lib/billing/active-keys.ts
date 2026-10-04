import 'server-only';

import { Prisma } from '@prisma/client';

import {
  ACTIVE_KEY_EXCLUDED_LIFECYCLES,
  type BillingScope,
} from '../../domain/billing';
import { prisma } from '../prisma';

/**
 * SQL fragment for a `TranslationKey` alias `tk`.
 * Excludes rows that have a TRANSLATION KeyMeta in a non-counting lifecycle.
 */
export function activeTranslationKeyExclusionSql(): Prisma.Sql {
  const lifecycles = Prisma.join(
    ACTIVE_KEY_EXCLUDED_LIFECYCLES.map(
      (lifecycle) => Prisma.sql`${lifecycle}::"KeyLifecycle"`
    )
  );
  return Prisma.sql`
    NOT EXISTS (
      SELECT 1
      FROM "KeyMeta" km
      WHERE km."projectId" = tk."projectId"
        AND km."key" = tk."key"
        AND km."type" = 'TRANSLATION'::"KeyType"
        AND km."lifecycle" IN (${lifecycles})
    )
  `;
}

export async function countActiveTranslationKeys(
  projectIds: string[]
): Promise<number> {
  if (projectIds.length === 0) {
    return 0;
  }
  const exclusion = activeTranslationKeyExclusionSql();
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "TranslationKey" tk
    WHERE tk."projectId" IN (${Prisma.join(projectIds)})
      AND ${exclusion}
  `;
  return rows[0]?.count ?? 0;
}

/** Incoming names that already count as active translation keys in this project. */
export async function countIncomingAlreadyActive(
  projectId: string,
  names: string[]
): Promise<number> {
  if (names.length === 0) {
    return 0;
  }
  const exclusion = activeTranslationKeyExclusionSql();
  const rows = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int AS count
    FROM "TranslationKey" tk
    WHERE tk."projectId" = ${projectId}
      AND tk."key" IN (${Prisma.join(names)})
      AND ${exclusion}
  `;
  return rows[0]?.count ?? 0;
}

export async function projectIdsForBillingScope(
  project: { id: string; teamId: string },
  billingScope: BillingScope
): Promise<string[]> {
  if (billingScope === 'project') {
    return [project.id];
  }
  const rows = await prisma.translationProject.findMany({
    where: { teamId: project.teamId, billingScope: 'TEAM' },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}
