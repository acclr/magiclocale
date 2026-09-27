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

/** Free: a real product trial, limited by product size. */
export const FREE_MAX_TEAM_MEMBERS = 2;
export const FREE_MAX_PROJECTS = 1;
export const FREE_MAX_LOCALES = 3;
export const FREE_MAX_SOURCE_KEYS = 500;
export const FREE_MAX_ENVIRONMENTS = 1;
export const FREE_MAX_FLAGS = 10;

/**
 * Pro (`premium` id, kept so existing Stripe price env vars stay valid).
 * Languages, projects, and seats are unlimited. Active keys are the meter.
 */
export const PREMIUM_MAX_TEAM_MEMBERS = null;
export const PREMIUM_MAX_PROJECTS = null;
export const PREMIUM_MAX_LOCALES = null;
export const PREMIUM_MAX_SOURCE_KEYS = 3_000;
export const PREMIUM_MAX_ENVIRONMENTS = null;
export const PREMIUM_MAX_FLAGS = null;
export const PREMIUM_AMOUNT_CENTS = 2_900;

export const ENTERPRISE_MAX_ENVIRONMENTS = null;
export const ENTERPRISE_AMOUNT_CENTS = 29_900;

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
      'For side projects, prototypes, and trying Keykit with a real application.',
    features: [
      '500 active translation keys',
      '3 languages',
      '1 project · 1 connected source',
      '2 team members',
      'Automatic key discovery and deprecation',
      'Static delivery and limited live delivery',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Pro',
    amountCents: PREMIUM_AMOUNT_CENTS,
    interval: 'month',
    maxTeamMembers: PREMIUM_MAX_TEAM_MEMBERS,
    maxProjects: PREMIUM_MAX_PROJECTS,
    maxLocales: PREMIUM_MAX_LOCALES,
    maxSourceKeysPerProject: PREMIUM_MAX_SOURCE_KEYS,
    maxEnvironments: PREMIUM_MAX_ENVIRONMENTS,
    maxFlags: PREMIUM_MAX_FLAGS,
    description:
      'Everything a software team needs. Unlimited languages and seats. Pay for active keys, not people.',
    features: [
      '3,000 active keys included',
      'Unlimited languages, projects, and team members',
      '5 connected sources',
      'Live and static delivery',
      'Review workflow and translation history',
      'Deprecated and archived keys are free',
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
      'From $299/month for governance, security, support, and higher committed capacity.',
    features: [
      '25,000+ active keys',
      'Unlimited languages, projects, members, and sources',
      'SAML SSO, SCIM, and audit logs',
      'Custom delivery and AI allowance',
      'SLA and migration assistance',
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
    `Upgrade to Pro for unlimited languages.`
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
    'Upgrade to Pro or Enterprise for more environments.'
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
    'Upgrade to Pro or Enterprise for more flags.'
  );
}

export function teamMemberLimitMessage(maxMembers: number): string {
  return (
    `Your plan includes up to ${maxMembers} team members ` +
    '(including pending invitations). Upgrade to Pro or Enterprise for unlimited seats.'
  );
}

export function projectLimitMessage(maxProjects: number): string {
  return (
    `Your plan includes up to ${maxProjects} translation project(s). ` +
    'Upgrade to Pro or Enterprise for unlimited projects.'
  );
}

export function sourceKeyLimitMessage(maxKeys: number): string {
  return (
    `This project has reached the ${maxKeys.toLocaleString()} source key limit on your plan. ` +
    'Upgrade to Pro or Enterprise for a higher active-key allowance.'
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
