import 'server-only';

import {
  MAGILOCALE_PLANS,
  type MagilocaleEntitlement,
  type MagilocalePlanId,
} from '../../domain/billing';
import { prisma } from '../prisma';

export function getMagilocaleStripePriceIds(): Record<
  MagilocalePlanId,
  string
> {
  return {
    starter: process.env.STRIPE_STARTER_PRICE_ID?.trim() ?? '',
    enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID?.trim() ?? '',
  };
}

export function planIdForPriceId(priceId: string): MagilocalePlanId | null {
  const prices = getMagilocaleStripePriceIds();
  if (priceId && priceId === prices.enterprise) {
    return 'enterprise';
  }
  if (priceId && priceId === prices.starter) {
    return 'starter';
  }
  return null;
}

export async function getTeamEntitlement(
  billingId: string | null
): Promise<MagilocaleEntitlement> {
  const subscriptions = billingId
    ? await prisma.subscription.findMany({
        where: { customerId: billingId, active: true },
      })
    : [];
  const now = Date.now();
  const live = subscriptions.filter(
    (subscription) => subscription.endDate.getTime() > now
  );

  const hasEnterprise = live.some(
    (subscription) => planIdForPriceId(subscription.priceId) === 'enterprise'
  );
  const starter = live.find(
    (subscription) => planIdForPriceId(subscription.priceId) === 'starter'
  );

  if (hasEnterprise) {
    return {
      planId: 'enterprise',
      plan: MAGILOCALE_PLANS.enterprise,
      subscribed: true,
      maxLocales: MAGILOCALE_PLANS.enterprise.maxLocales,
      priceId:
        live.find(
          (subscription) =>
            planIdForPriceId(subscription.priceId) === 'enterprise'
        )?.priceId ?? null,
    };
  }

  return {
    planId: 'starter',
    plan: MAGILOCALE_PLANS.starter,
    subscribed: Boolean(starter),
    maxLocales: MAGILOCALE_PLANS.starter.maxLocales,
    priceId: starter?.priceId ?? null,
  };
}
