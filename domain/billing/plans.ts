export type MagilocalePlanId = 'starter' | 'enterprise';

export type BillingScope = 'team' | 'project';

export type MagilocalePlan = {
  id: MagilocalePlanId;
  name: string;
  amountCents: number;
  interval: 'month';
  maxLocales: number | null;
  maxEnvironments: number | null;
  maxFlags: number | null;
  description: string;
  features: string[];
};

export const STARTER_MAX_LOCALES = 4;
export const STARTER_MAX_ENVIRONMENTS = 2;
export const STARTER_MAX_FLAGS = 25;
export const ENTERPRISE_MAX_ENVIRONMENTS = 3;

export const MAGILOCALE_PLANS: Record<MagilocalePlanId, MagilocalePlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    amountCents: 500,
    interval: 'month',
    maxLocales: STARTER_MAX_LOCALES,
    maxEnvironments: STARTER_MAX_ENVIRONMENTS,
    maxFlags: STARTER_MAX_FLAGS,
    description:
      '$5/month for standard usage. Includes up to 4 languages per billed project.',
    features: [
      'Automatic key discovery',
      'AI fill and human review',
      'Up to 4 languages per billed project',
      '2 environments and 25 feature flags',
      'Team retainer or per-project billing',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    amountCents: 5_000,
    interval: 'month',
    maxLocales: null,
    maxEnvironments: ENTERPRISE_MAX_ENVIRONMENTS,
    maxFlags: null,
    description:
      '$50/month when a project needs 5 or more languages, with higher usage.',
    features: [
      'Everything in Starter',
      '5+ languages on the billed project or retainer',
      'Unlimited locales and feature flags',
      'Up to 3 environments per project',
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

export function canAddEnvironment(
  currentCount: number,
  maxEnvironments: number | null
): boolean {
  if (maxEnvironments === null) {
    return true;
  }
  return currentCount < maxEnvironments;
}

export function environmentLimitMessage(maxEnvironments: number): string {
  return (
    `This plan includes up to ${maxEnvironments} environments per project. ` +
    'Upgrade to Enterprise to add a third environment.'
  );
}

export function canAddFlag(
  currentCount: number,
  maxFlags: number | null
): boolean {
  if (maxFlags === null) {
    return true;
  }
  return currentCount < maxFlags;
}

export function flagLimitMessage(maxFlags: number): string {
  return (
    `Starter includes up to ${maxFlags} feature flags per project. ` +
    'Upgrade to Enterprise for unlimited flags.'
  );
}

export type MagilocaleEntitlement = {
  planId: MagilocalePlanId;
  plan: MagilocalePlan;
  subscribed: boolean;
  maxLocales: number | null;
  maxEnvironments: number | null;
  maxFlags: number | null;
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
      maxEnvironments: MAGILOCALE_PLANS.enterprise.maxEnvironments,
      maxFlags: MAGILOCALE_PLANS.enterprise.maxFlags,
      priceId: enterprisePriceId,
      billingScope,
    };
  }

  return {
    planId: 'starter',
    plan: MAGILOCALE_PLANS.starter,
    subscribed: Boolean(starterPrice),
    maxLocales: MAGILOCALE_PLANS.starter.maxLocales,
    maxEnvironments: MAGILOCALE_PLANS.starter.maxEnvironments,
    maxFlags: MAGILOCALE_PLANS.starter.maxFlags,
    priceId: starterPrice ?? null,
    billingScope,
  };
}
