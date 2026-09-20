export type KeykitPlanId = 'free' | 'premium' | 'enterprise';

export type BillingScope = 'team' | 'project';

export type KeykitPlan = {
  id: KeykitPlanId;
  name: string;
  amountCents: number;
  interval: 'month';
  maxTeamMembers: number | null;
  maxProjects: number | null;
  maxLocales: number | null;
  maxSourceKeysPerProject: number | null;
  maxEnvironments: number | null;
  maxFlags: number | null;
  description: string;
  features: string[];
};

/** Free: small teams trying Keykit (2 seats — product requirement). */
export const FREE_MAX_TEAM_MEMBERS = 2;
export const FREE_MAX_PROJECTS = 1;
export const FREE_MAX_LOCALES = 2;
export const FREE_MAX_SOURCE_KEYS = 1_000;
export const FREE_MAX_ENVIRONMENTS = 1;
export const FREE_MAX_FLAGS = 10;

/** Premium: below Crowdin Pro ($50) and Lokalise entry (~$144); key-based like Lokalise. */
export const PREMIUM_MAX_TEAM_MEMBERS = 10;
export const PREMIUM_MAX_PROJECTS = 5;
export const PREMIUM_MAX_LOCALES = 6;
export const PREMIUM_MAX_SOURCE_KEYS = 10_000;
export const PREMIUM_MAX_ENVIRONMENTS = 2;
export const PREMIUM_MAX_FLAGS = 50;
export const PREMIUM_AMOUNT_CENTS = 1_200;

export const ENTERPRISE_MAX_ENVIRONMENTS = 5;
export const ENTERPRISE_AMOUNT_CENTS = 4_900;

/** @deprecated Use PREMIUM_* — kept for tests referencing old names. */
export const STARTER_MAX_LOCALES = PREMIUM_MAX_LOCALES;
export const STARTER_MAX_ENVIRONMENTS = PREMIUM_MAX_ENVIRONMENTS;
export const STARTER_MAX_FLAGS = PREMIUM_MAX_FLAGS;

export const KEYKIT_PLANS: Record<KeykitPlanId, KeykitPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    amountCents: 0,
    interval: 'month',
    maxTeamMembers: FREE_MAX_TEAM_MEMBERS,
    maxProjects: FREE_MAX_PROJECTS,
    maxLocales: FREE_MAX_LOCALES,
    maxSourceKeysPerProject: FREE_MAX_SOURCE_KEYS,
    maxEnvironments: FREE_MAX_ENVIRONMENTS,
    maxFlags: FREE_MAX_FLAGS,
    description:
      'For side projects and evaluation — 2 teammates, 1 project, and core workflow.',
    features: [
      '2 team members',
      '1 translation project',
      'Up to 2 languages per project',
      '1,000 source keys & 1 environment',
      '10 feature flags',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    amountCents: PREMIUM_AMOUNT_CENTS,
    interval: 'month',
    maxTeamMembers: PREMIUM_MAX_TEAM_MEMBERS,
    maxProjects: PREMIUM_MAX_PROJECTS,
    maxLocales: PREMIUM_MAX_LOCALES,
    maxSourceKeysPerProject: PREMIUM_MAX_SOURCE_KEYS,
    maxEnvironments: PREMIUM_MAX_ENVIRONMENTS,
    maxFlags: PREMIUM_MAX_FLAGS,
    description:
      '$12/month for growing product teams — well under typical TMS entry pricing.',
    features: [
      '10 team members',
      '5 translation projects',
      'Up to 6 languages per project',
      '10,000 source keys per project',
      '2 environments & 50 feature flags',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    amountCents: ENTERPRISE_AMOUNT_CENTS,
    interval: 'month',
    maxTeamMembers: null,
    maxProjects: null,
    maxLocales: null,
    maxSourceKeysPerProject: null,
    maxEnvironments: ENTERPRISE_MAX_ENVIRONMENTS,
    maxFlags: null,
    description:
      '$49/month for larger apps — unlimited projects, languages, keys, and seats.',
    features: [
      'Unlimited team members & projects',
      'Unlimited languages & source keys',
      '5 environments per project',
      'Unlimited feature flags',
      'Priority usage for AI translation',
    ],
  },
};

export const PAID_KEYKIT_PLAN_IDS: KeykitPlanId[] = ['premium', 'enterprise'];

export function canAddWithinLimit(
  currentCount: number,
  max: number | null
): boolean {
  if (max === null) {
    return true;
  }
  return currentCount < max;
}

export function canAddProjectLocale(
  currentLocaleCount: number,
  maxLocales: number | null
): boolean {
  return canAddWithinLimit(currentLocaleCount, maxLocales);
}

export function localeLimitMessage(maxLocales: number): string {
  return (
    `Your plan includes up to ${maxLocales} languages per project. ` +
    `Upgrade from Free or move to Enterprise for more languages.`
  );
}

export function canAddEnvironment(
  currentCount: number,
  maxEnvironments: number | null
): boolean {
  return canAddWithinLimit(currentCount, maxEnvironments);
}

export function environmentLimitMessage(maxEnvironments: number): string {
  return (
    `This plan includes up to ${maxEnvironments} environments per project. ` +
    'Upgrade to Enterprise for more environments.'
  );
}

export function canAddFlag(
  currentCount: number,
  maxFlags: number | null
): boolean {
  return canAddWithinLimit(currentCount, maxFlags);
}

export function flagLimitMessage(maxFlags: number): string {
  return (
    `Your plan includes up to ${maxFlags} feature flags per project. ` +
    'Upgrade to Enterprise for unlimited flags.'
  );
}

export function teamMemberLimitMessage(maxMembers: number): string {
  return (
    `Your plan includes up to ${maxMembers} team members ` +
    '(including pending invitations). Upgrade to Premium or Enterprise for more seats.'
  );
}

export function projectLimitMessage(maxProjects: number): string {
  return (
    `Your plan includes up to ${maxProjects} translation project(s). ` +
    'Upgrade to Premium or Enterprise for more projects.'
  );
}

export function sourceKeyLimitMessage(maxKeys: number): string {
  return (
    `This project has reached the ${maxKeys.toLocaleString()} source key limit on your plan. ` +
    'Upgrade to Premium or Enterprise for a higher cap.'
  );
}

export type KeykitEntitlement = {
  planId: KeykitPlanId;
  plan: KeykitPlan;
  /** True when the team has an active paid subscription for the current plan. */
  subscribed: boolean;
  maxTeamMembers: number | null;
  maxProjects: number | null;
  maxLocales: number | null;
  maxSourceKeysPerProject: number | null;
  maxEnvironments: number | null;
  maxFlags: number | null;
  priceId: string | null;
  billingScope: BillingScope;
};

function entitlementFromPlan(
  planId: KeykitPlanId,
  billingScope: BillingScope,
  options: { subscribed: boolean; priceId: string | null }
): KeykitEntitlement {
  const plan = KEYKIT_PLANS[planId];
  return {
    planId,
    plan,
    subscribed: options.subscribed,
    maxTeamMembers: plan.maxTeamMembers,
    maxProjects: plan.maxProjects,
    maxLocales: plan.maxLocales,
    maxSourceKeysPerProject: plan.maxSourceKeysPerProject,
    maxEnvironments: plan.maxEnvironments,
    maxFlags: plan.maxFlags,
    priceId: options.priceId,
    billingScope,
  };
}

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

export function resolveKeykitPlan(
  livePriceIds: string[],
  catalogPriceIds: Record<'premium' | 'enterprise', string>,
  billingScope: BillingScope
): KeykitEntitlement {
  const enterprisePriceId = catalogPriceIds.enterprise;
  const premiumPriceId = catalogPriceIds.premium;
  const hasEnterprise = Boolean(
    enterprisePriceId && livePriceIds.includes(enterprisePriceId)
  );
  const hasPremium = Boolean(
    premiumPriceId && livePriceIds.includes(premiumPriceId)
  );

  if (hasEnterprise) {
    return entitlementFromPlan('enterprise', billingScope, {
      subscribed: true,
      priceId: enterprisePriceId,
    });
  }

  if (hasPremium) {
    return entitlementFromPlan('premium', billingScope, {
      subscribed: true,
      priceId: premiumPriceId,
    });
  }

  return entitlementFromPlan('free', billingScope, {
    subscribed: false,
    priceId: null,
  });
}
