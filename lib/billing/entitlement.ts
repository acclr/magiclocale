import 'server-only';

import {
  customerIdForScope,
  resolveLocaleKitPlan,
  type BillingScope,
  type LocaleKitEntitlement,
  type LocaleKitPlanId,
} from '../../domain/billing';
import type { Project } from '../../domain/translations';
import { prisma } from '../prisma';

export function getLocaleKitStripePriceIds(): Record<
  LocaleKitPlanId,
  string
> {
  return {
    starter: process.env.STRIPE_STARTER_PRICE_ID?.trim() ?? '',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID?.trim() ?? '',
  };
}

export function planIdForPriceId(priceId: string): LocaleKitPlanId | null {
  const prices = getLocaleKitStripePriceIds();
  if (priceId && priceId === prices.enterprise) {
    return 'enterprise';
  }
  if (priceId && priceId === prices.starter) {
    return 'starter';
  }
  return null;
}

export async function getEntitlementForCustomer(
  billingId: string | null | undefined,
  billingScope: BillingScope
): Promise<LocaleKitEntitlement> {
  const subscriptions = billingId
    ? await prisma.subscription.findMany({
        where: { customerId: billingId, active: true },
      })
    : [];
  const now = Date.now();
  const livePriceIds = subscriptions
    .filter((subscription) => subscription.endDate.getTime() > now)
    .map((subscription) => subscription.priceId);

  return resolveLocaleKitPlan(
    livePriceIds,
    getLocaleKitStripePriceIds(),
    billingScope
  );
}

export async function getTeamEntitlement(
  billingId: string | null
): Promise<LocaleKitEntitlement> {
  return getEntitlementForCustomer(billingId, 'team');
}

export async function getProjectEntitlement(
  project: Pick<Project, 'billingScope' | 'billingId'>,
  teamBillingId: string | null
): Promise<LocaleKitEntitlement> {
  const billingScope = project.billingScope ?? 'team';
  return getEntitlementForCustomer(
    customerIdForScope(billingScope, teamBillingId, project.billingId),
    billingScope
  );
}
