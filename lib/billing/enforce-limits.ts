import 'server-only';

import {
  canAddWithinLimit,
  connectedSourceLimitMessage,
  customerIdForScope,
  projectLimitMessage,
  sourceKeyLimitMessage,
  teamMemberLimitMessage,
  type BillingScope,
  type KeykitEntitlement,
} from '../../domain/billing';
import { ApiError } from '../errors';
import { prisma } from '../prisma';
import {
  countActiveTranslationKeys,
  countIncomingAlreadyActive,
  projectIdsForBillingScope,
} from './active-keys';
import { getTeamEntitlement } from './entitlement';
import { recordActiveKeyOverage } from './plan-usage';

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

type CapacityProject = {
  id: string;
  teamId: string;
  billingScope: BillingScope;
  billingId: string | null;
};

/**
 * Active keys are one pool for the billing scope.
 * Free hard-stops at the included count. Pro allows the keys and bills overage.
 * Unlimited plans (included null) are not metered here.
 */
export async function enforceSourceKeyCapacity(
  project: CapacityProject,
  entitlement: KeykitEntitlement,
  incomingKeyNames: string[],
  teamBillingId: string | null
): Promise<void> {
  if (incomingKeyNames.length === 0) {
    return;
  }

  const included = entitlement.includedActiveKeys;
  if (included === null) {
    return;
  }

  const uniqueIncoming = Array.from(new Set(incomingKeyNames));
  const billingScope = entitlement.billingScope ?? project.billingScope;
  const projectIds = await projectIdsForBillingScope(project, billingScope);
  const currentActive = await countActiveTranslationKeys(projectIds);
  const alreadyActive = await countIncomingAlreadyActive(
    project.id,
    uniqueIncoming
  );
  const next = currentActive + (uniqueIncoming.length - alreadyActive);
  const overageCents = entitlement.activeKeyOverageCentsPerThousand;

  if (overageCents === null) {
    if (next > included) {
      throw new ApiError(402, sourceKeyLimitMessage(included));
    }
    return;
  }

  await recordActiveKeyOverage({
    billingScope,
    teamId: project.teamId,
    projectId: project.id,
    nextActiveKeys: next,
    includedActiveKeys: included,
    centsPerThousand: overageCents,
    stripeCustomerId: customerIdForScope(
      billingScope,
      teamBillingId,
      project.billingId
    ),
  });
}

export async function enforceConnectedSourceLimit(
  teamId: string,
  billingId: string | null | undefined
): Promise<void> {
  const entitlement = await getTeamEntitlement(billingId ?? null);
  const max = entitlement.maxConnectedSources;
  if (max === null) {
    return;
  }
  const count = await prisma.apiKey.count({ where: { teamId } });
  if (count >= max) {
    throw new ApiError(402, connectedSourceLimitMessage(max));
  }
}
