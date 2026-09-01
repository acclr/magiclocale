export type MagilocalePlanId = 'starter' | 'enterprise';

export type BillingScope = 'team' | 'project';

export type MagilocalePlan = {
  id: MagilocalePlanId;
  name: string;
  amountCents: number;
  interval: 'month';
  maxLocales: number | null;
  description: string;
  features: string[];
};

export const STARTER_MAX_LOCALES = 4;

export const MAGILOCALE_PLANS: Record<MagilocalePlanId, MagilocalePlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    amountCents: 500,
    interval: 'month',
    maxLocales: STARTER_MAX_LOCALES,
    description:
      '$5/month for standard usage. Includes up to 4 languages per billed project.',
    features: [
      'Automatic key discovery',
      'AI fill and human review',
      'Up to 4 languages per billed project',
      'Team retainer or per-project billing',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    amountCents: 5_000,
    interval: 'month',
    maxLocales: null,
    description:
      '$50/month when a project needs 5 or more languages, with higher usage.',
    features: [
      'Everything in Starter',
      '5+ languages on the billed project or retainer',
      'Unlimited locales',
      'Priority translation usage',
    ],
  },
};

export function canAddProjectLocale(
  currentLocaleCount: number,
  maxLocales: number | null
): boolean {
  if (maxLocales === null) {
    return true;
  }
  return currentLocaleCount < maxLocales;
}

export function localeLimitMessage(maxLocales: number): string {
  return (
    `Starter includes up to ${maxLocales} languages per project. ` +
    'Upgrade to Enterprise ($50/mo) to add a 5th language.'
  );
}

export type MagilocaleEntitlement = {
  planId: MagilocalePlanId;
  plan: MagilocalePlan;
  subscribed: boolean;
  maxLocales: number | null;
  priceId: string | null;
  billingScope: BillingScope;
};

export function customerIdForScope(
  billingScope: BillingScope,
  teamBillingId: string | null | undefined,
  projectBillingId: string | null | undefined
): string | null {
  if (billingScope === 'project') {
    return projectBillingId ?? null;
  }
  return teamBillingId ?? null;
}

export function resolveMagilocalePlan(
  livePriceIds: string[],
  catalogPriceIds: Record<MagilocalePlanId, string>,
  billingScope: BillingScope
): MagilocaleEntitlement {
  const enterprisePriceId = catalogPriceIds.enterprise;
  const starterPriceId = catalogPriceIds.starter;
  const hasEnterprise = Boolean(
    enterprisePriceId && livePriceIds.includes(enterprisePriceId)
  );
  const starterPrice = livePriceIds.find(
    (priceId) => priceId === starterPriceId
  );

  if (hasEnterprise) {
    return {
      planId: 'enterprise',
      plan: MAGILOCALE_PLANS.enterprise,
      subscribed: true,
      maxLocales: MAGILOCALE_PLANS.enterprise.maxLocales,
      priceId: enterprisePriceId,
      billingScope,
    };
  }

  return {
    planId: 'starter',
    plan: MAGILOCALE_PLANS.starter,
    subscribed: Boolean(starterPrice),
    maxLocales: MAGILOCALE_PLANS.starter.maxLocales,
    priceId: starterPrice ?? null,
    billingScope,
  };
}
