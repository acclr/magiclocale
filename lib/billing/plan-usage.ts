import 'server-only';

import { randomUUID } from 'crypto';

import {
  customerIdForScope,
  liveRequestLimitMessage,
  overageBlocks,
  planUsagePeriod,
  planUsageScopeId,
  type BillingScope,
} from '../../domain/billing';
import env from '../env';
import { prisma } from '../prisma';
import { stripe } from '../stripe';
import { getEntitlementForCustomer } from './entitlement';

type UsageSnapshot = {
  id: string;
  activeKeyHighWater: number;
  billedOverageBlocks: number;
  liveRequests: number;
};

let liveMeterFailureLogged = false;

function logLiveMeterFailure(error: unknown) {
  if (liveMeterFailureLogged) {
    return;
  }
  liveMeterFailureLogged = true;
  console.error(
    'Live request metering failed. Serving the read without a meter.',
    error
  );
}

/**
 * Raises the monthly high water and invoices new Pro overage blocks.
 * A failed Stripe invoice item is logged and left unbilled so a later sync retries.
 * Drops during the month do not refund.
 */
export async function recordActiveKeyOverage(input: {
  billingScope: BillingScope;
  teamId: string;
  projectId: string;
  nextActiveKeys: number;
  includedActiveKeys: number;
  centsPerThousand: number;
  stripeCustomerId: string | null;
}): Promise<void> {
  const scopeId = planUsageScopeId(
    input.billingScope,
    input.teamId,
    input.projectId
  );
  const period = planUsagePeriod();
  const rows = await prisma.$queryRaw<UsageSnapshot[]>`
    INSERT INTO "PlanUsage" (
      "id",
      "scopeId",
      "period",
      "activeKeyHighWater",
      "billedOverageBlocks",
      "liveRequests",
      "stripeCustomerId"
    )
    VALUES (
      ${randomUUID()},
      ${scopeId},
      ${period},
      ${input.nextActiveKeys},
      0,
      0,
      ${input.stripeCustomerId}
    )
    ON CONFLICT ("scopeId", "period")
    DO UPDATE SET
      "activeKeyHighWater" = GREATEST(
        "PlanUsage"."activeKeyHighWater",
        EXCLUDED."activeKeyHighWater"
      ),
      "stripeCustomerId" = COALESCE(
        EXCLUDED."stripeCustomerId",
        "PlanUsage"."stripeCustomerId"
      )
    RETURNING
      "id",
      "activeKeyHighWater",
      "billedOverageBlocks",
      "liveRequests"
  `;
  const row = rows[0];
  if (!row) {
    return;
  }

  const blocks = overageBlocks(
    row.activeKeyHighWater,
    input.includedActiveKeys
  );
  const delta = blocks - row.billedOverageBlocks;
  if (delta <= 0 || !input.stripeCustomerId || !env.stripe.secretKey) {
    return;
  }

  const additionalKeys = delta * 1000;
  try {
    await stripe.invoiceItems.create({
      customer: input.stripeCustomerId,
      amount: delta * input.centsPerThousand,
      currency: 'usd',
      description: `Keykit Pro: ${additionalKeys.toLocaleString('en-US')} additional active keys`,
    });
  } catch (error) {
    console.error('Failed to create Keykit Pro overage invoice item.', error);
    return;
  }

  await prisma.planUsage.updateMany({
    where: {
      id: row.id,
      billedOverageBlocks: row.billedOverageBlocks,
    },
    data: {
      billedOverageBlocks: row.billedOverageBlocks + delta,
    },
  });
}

export async function consumeLiveRequest(
  projectId: string
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  try {
    return await meterLiveRequest(projectId);
  } catch (error) {
    logLiveMeterFailure(error);
    return { allowed: true };
  }
}

async function meterLiveRequest(
  projectId: string
): Promise<{ allowed: true } | { allowed: false; message: string }> {
  const project = await prisma.translationProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      teamId: true,
      billingScope: true,
      billingId: true,
      team: { select: { billingId: true } },
    },
  });
  if (!project) {
    return { allowed: true };
  }

  const billingScope: BillingScope =
    project.billingScope === 'PROJECT' ? 'project' : 'team';
  const stripeCustomerId = customerIdForScope(
    billingScope,
    project.team.billingId,
    project.billingId
  );
  const entitlement = await getEntitlementForCustomer(
    stripeCustomerId,
    billingScope
  );
  const liveRequests = await incrementLiveRequests(
    planUsageScopeId(billingScope, project.teamId, project.id),
    planUsagePeriod(),
    stripeCustomerId
  );
  const max = entitlement.maxLiveRequestsPerMonth;
  if (max !== null && liveRequests > max) {
    return { allowed: false, message: liveRequestLimitMessage(max) };
  }
  return { allowed: true };
}

async function incrementLiveRequests(
  scopeId: string,
  period: string,
  stripeCustomerId: string | null
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ liveRequests: number }>>`
    INSERT INTO "PlanUsage" (
      "id",
      "scopeId",
      "period",
      "activeKeyHighWater",
      "billedOverageBlocks",
      "liveRequests",
      "stripeCustomerId"
    )
    VALUES (
      ${randomUUID()},
      ${scopeId},
      ${period},
      0,
      0,
      1,
      ${stripeCustomerId}
    )
    ON CONFLICT ("scopeId", "period")
    DO UPDATE SET
      "liveRequests" = "PlanUsage"."liveRequests" + 1,
      "stripeCustomerId" = COALESCE(
        EXCLUDED."stripeCustomerId",
        "PlanUsage"."stripeCustomerId"
      )
    RETURNING "liveRequests"
  `;
  return rows[0]?.liveRequests ?? 1;
}
