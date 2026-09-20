import 'server-only';

import {
  KEYKIT_PLANS,
  type BillingScope,
  type KeykitPlanId,
} from '../../domain/billing';
import { getByCustomerId } from '../../models/subscription';
import {
  getEntitlementForCustomer,
  getKeykitStripePriceIds,
  planIdForPriceId,
} from './entitlement';

const CATALOG_PLAN_ORDER: KeykitPlanId[] = ['free', 'premium', 'enterprise'];

export async function getBillingCatalog(
  customerId: string | null | undefined,
  billingScope: BillingScope
) {
  const entitlement = await getEntitlementForCustomer(customerId, billingScope);
  const priceIds = getKeykitStripePriceIds();
  const subscriptions = customerId ? await getByCustomerId(customerId) : [];

  return {
    entitlement,
    plans: CATALOG_PLAN_ORDER.map((id) => ({
      ...KEYKIT_PLANS[id],
      priceId:
        id === 'free'
          ? null
          : priceIds[id as 'premium' | 'enterprise'] || null,
      current:
        entitlement.planId === id &&
        (id === 'free' || entitlement.subscribed),
    })),
    subscriptions: subscriptions
      .filter((subscription) => subscription.active)
      .map((subscription) => ({
        ...subscription,
        planId: planIdForPriceId(subscription.priceId),
        planName: (() => {
          const planId = planIdForPriceId(subscription.priceId);
          return planId ? KEYKIT_PLANS[planId].name : 'Keykit';
        })(),
      })),
  };
}
