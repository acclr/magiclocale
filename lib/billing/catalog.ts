import 'server-only';

import { MAGILOCALE_PLANS, type BillingScope } from '../../domain/billing';
import { getByCustomerId } from '../../models/subscription';
import {
  getEntitlementForCustomer,
  getMagilocaleStripePriceIds,
  planIdForPriceId,
} from './entitlement';

export async function getBillingCatalog(
  customerId: string | null | undefined,
  billingScope: BillingScope
) {
  const entitlement = await getEntitlementForCustomer(customerId, billingScope);
  const priceIds = getMagilocaleStripePriceIds();
  const subscriptions = customerId ? await getByCustomerId(customerId) : [];

  return {
    entitlement,
    plans: (['starter', 'enterprise'] as const).map((id) => ({
      ...MAGILOCALE_PLANS[id],
      priceId: priceIds[id] || null,
      current: entitlement.planId === id && entitlement.subscribed,
    })),
    subscriptions: subscriptions
      .filter((subscription) => subscription.active)
      .map((subscription) => ({
        ...subscription,
        planId: planIdForPriceId(subscription.priceId),
        planName: (() => {
          const planId = planIdForPriceId(subscription.priceId);
          return planId ? MAGILOCALE_PLANS[planId].name : 'Magilocale';
        })(),
      })),
  };
}
