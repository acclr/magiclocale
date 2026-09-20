import 'server-only';

import {
  canAddWithinLimit,
  projectLimitMessage,
  sourceKeyLimitMessage,
  teamMemberLimitMessage,
  type KeykitEntitlement,
} from '../../domain/billing';
import { ApiError } from '../errors';
import { prisma } from '../prisma';
import { getTeamEntitlement } from './entitlement';

export async function countTeamSeatsUsed(teamId: string): Promise<number> {
  const [members, invitations] = await Promise.all([
    prisma.teamMember.count({ where: { teamId } }),
    prisma.invitation.count({ where: { teamId } }),
  ]);
  return members + invitations;
}

export async function getTeamEntitlementByBillingId(
  billingId: string | null | undefined
): Promise<KeykitEntitlement> {
  return getTeamEntitlement(billingId ?? null);
}

export async function enforceTeamMemberLimit(
  teamId: string,
  billingId: string | null | undefined
): Promise<void> {
  const entitlement = await getTeamEntitlement(billingId ?? null);
  if (entitlement.maxTeamMembers === null) {
    return;
  }
  const seats = await countTeamSeatsUsed(teamId);
  if (!canAddWithinLimit(seats, entitlement.maxTeamMembers)) {
    throw new ApiError(402, teamMemberLimitMessage(entitlement.maxTeamMembers));
  }
}

export async function enforceProjectLimit(
  teamId: string,
  billingId: string | null | undefined,
  currentProjectCount: number
): Promise<void> {
  const entitlement = await getTeamEntitlement(billingId ?? null);
  if (entitlement.maxProjects === null) {
    return;
  }
  if (!canAddWithinLimit(currentProjectCount, entitlement.maxProjects)) {
    throw new ApiError(402, projectLimitMessage(entitlement.maxProjects));
  }
}

export async function enforceSourceKeyCapacity(
  projectId: string,
  entitlement: KeykitEntitlement,
  incomingKeyNames: string[]
): Promise<void> {
  const max = entitlement.maxSourceKeysPerProject;
  if (max === null || incomingKeyNames.length === 0) {
    return;
  }

  const uniqueIncoming = Array.from(new Set(incomingKeyNames));
  const existing = await prisma.translationKey.findMany({
    where: { projectId, key: { in: uniqueIncoming } },
    select: { key: true },
  });
  const existingKeys = new Set(existing.map((row) => row.key));
  const newKeys = uniqueIncoming.filter((key) => !existingKeys.has(key)).length;
  const currentTotal = await prisma.translationKey.count({
    where: { projectId },
  });

  if (currentTotal + newKeys > max) {
    throw new ApiError(402, sourceKeyLimitMessage(max));
  }
}
