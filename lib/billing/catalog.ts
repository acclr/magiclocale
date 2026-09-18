import 'server-only';

import { LOCALEKIT_PLANS, type BillingScope } from '../../domain/billing';
import { getByCustomerId } from '../../models/subscription';
import {
  getEntitlementForCustomer,
  getLocaleKitStripePriceIds,
  planIdForPriceId,
} from './entitlement';

export async function getBillingCatalog(
  customerId: string | null | undefined,
  billingScope: BillingScope
) {
  const entitlement = await getEntitlementForCustomer(customerId, billingScope);
  const priceIds = getLocaleKitStripePriceIds();
  const subscriptions = customerId ? await getByCustomerId(customerId) : [];

  return {
    entitlement,
    plans: (['starter', 'enterprise'] as const).map((id) => ({
      ...LOCALEKIT_PLANS[id],
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
          return planId ? LOCALEKIT_PLANS[planId].name : 'LocaleKit';
        })(),
      })),
  };
}
