import 'server-only';

import {
  customerIdForScope,
  resolveKeykitPlan,
  type BillingScope,
  type KeykitEntitlement,
  type KeykitPlanId,
} from '../../domain/billing';
import type { Project } from '../../domain/translations';
import { prisma } from '../prisma';
import { stripe } from '../stripe';
import { resolveStripePriceId } from './stripe-price';

export type PaidKeykitPlanId = 'premium' | 'enterprise';

export function getKeykitStripePriceIds(): Record<PaidKeykitPlanId, string> {
  const premium =
    process.env.STRIPE_PREMIUM_PRICE_ID?.trim() ||
    process.env.STRIPE_STARTER_PRICE_ID?.trim() ||
    '';
  const enterprise = process.env.STRIPE_ENTERPRISE_PRICE_ID?.trim() ?? '';
  return {
    premium,
    enterprise,
  };
}

export function planIdForPriceId(
  priceId: string,
  prices: Record<PaidKeykitPlanId, string> = getKeykitStripePriceIds()
): KeykitPlanId | null {
  if (priceId && priceId === prices.enterprise) {
    return 'enterprise';
  }
  if (priceId && priceId === prices.premium) {
    return 'premium';
  }
  return null;
}

let resolvedPriceIds:
  | { key: string; ids: Record<PaidKeykitPlanId, string> }
  | undefined;

/** Maps configured `prod_` or `price_` ids to the Price id Checkout and webhooks use. */
export async function getResolvedKeykitStripePriceIds(): Promise<
  Record<PaidKeykitPlanId, string>
> {
  const configured = getKeykitStripePriceIds();
  const key = `${configured.premium}\n${configured.enterprise}`;
  if (resolvedPriceIds?.key === key) {
    return resolvedPriceIds.ids;
  }

  const ids = {
    premium: await resolveStripePriceId(stripe, configured.premium),
    enterprise: configured.enterprise
      ? await resolveStripePriceId(stripe, configured.enterprise)
      : '',
  };
  resolvedPriceIds = { key, ids };
  return ids;
}

export async function getEntitlementForCustomer(
  billingId: string | null | undefined,
  billingScope: BillingScope
): Promise<KeykitEntitlement> {
  const subscriptions = billingId
    ? await prisma.subscription.findMany({
        where: { customerId: billingId, active: true },
      })
    : [];
  const now = Date.now();
  const livePriceIds = subscriptions
    .filter((subscription) => subscription.endDate.getTime() > now)
    .map((subscription) => subscription.priceId);

  return resolveKeykitPlan(
    livePriceIds,
    await getResolvedKeykitStripePriceIds(),
    billingScope
  );
}

export async function getTeamEntitlement(
  billingId: string | null
): Promise<KeykitEntitlement> {
  return getEntitlementForCustomer(billingId, 'team');
}

export async function getProjectEntitlement(
  project: Pick<Project, 'billingScope' | 'billingId'>,
  teamBillingId: string | null
): Promise<KeykitEntitlement> {
  const billingScope = project.billingScope ?? 'team';
  return getEntitlementForCustomer(
    customerIdForScope(billingScope, teamBillingId, project.billingId),
    billingScope
  );
}
