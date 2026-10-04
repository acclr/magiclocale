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
  /** Hard cap on active keys when overage billing is null. Null means extra keys are not blocked. */
  maxSourceKeysPerProject: number | null;
  maxEnvironments: number | null;
  maxFlags: number | null;
  /** Connected apps. A team API key is one source. Null is unlimited. */
  maxConnectedSources: number | null;
  /** Successful public live reads per UTC month. Null is unlimited. */
  maxLiveRequestsPerMonth: number | null;
  /** Active keys included before a hard stop or overage. Null is unlimited. Account-level for the billing scope. */
  includedActiveKeys: number | null;
  /** Cents charged per extra 1,000 active keys. Null is a hard stop (or unlimited when included is null). */
  activeKeyOverageCentsPerThousand: number | null;
  /** False hides self-serve checkout. Existing subscriptions still resolve. */
  selfServe: boolean;
  description: string;
  features: string[];
};

/** Free: a real product trial, limited by product size. */
export const FREE_MAX_TEAM_MEMBERS = 2;
export const FREE_MAX_PROJECTS = 1;
export const FREE_MAX_LOCALES = 3;
export const FREE_MAX_SOURCE_KEYS = 500;
/** Not sold on the landing page. The domain still caps environments at 3. */
export const FREE_MAX_ENVIRONMENTS = null;
export const FREE_MAX_FLAGS = null;
export const FREE_MAX_CONNECTED_SOURCES = 1;
/** What "limited live delivery" means. Not printed on the landing card. */
export const FREE_MAX_LIVE_REQUESTS_PER_MONTH = 100_000;
export const FREE_INCLUDED_ACTIVE_KEYS = FREE_MAX_SOURCE_KEYS;

/**
 * Pro (`premium` id, kept so existing Stripe price env vars stay valid).
 * Languages, projects, and seats are unlimited. Active keys are the meter.
 */
export const PREMIUM_MAX_TEAM_MEMBERS = null;
export const PREMIUM_MAX_PROJECTS = null;
export const PREMIUM_MAX_LOCALES = null;
/** Extra keys are billed, not blocked. */
export const PREMIUM_MAX_SOURCE_KEYS = null;
export const PREMIUM_MAX_ENVIRONMENTS = null;
export const PREMIUM_MAX_FLAGS = null;
export const PREMIUM_MAX_CONNECTED_SOURCES = 5;
export const PREMIUM_MAX_LIVE_REQUESTS_PER_MONTH = 1_000_000;
export const PREMIUM_INCLUDED_ACTIVE_KEYS = 3_000;
export const PREMIUM_ACTIVE_KEY_OVERAGE_CENTS_PER_THOUSAND = 400;
export const PREMIUM_AMOUNT_CENTS = 2_900;

export const ENTERPRISE_MAX_ENVIRONMENTS = null;
export const ENTERPRISE_AMOUNT_CENTS = 29_900;

/** Lifecycles that do not count as active keys. UNUSED still counts. */
export const ACTIVE_KEY_EXCLUDED_LIFECYCLES = [
  'DEPRECATED',
  'ARCHIVED',
] as const;

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
    maxConnectedSources: FREE_MAX_CONNECTED_SOURCES,
    maxLiveRequestsPerMonth: FREE_MAX_LIVE_REQUESTS_PER_MONTH,
    includedActiveKeys: FREE_INCLUDED_ACTIVE_KEYS,
    activeKeyOverageCentsPerThousand: null,
    selfServe: true,
    description:
      'For side projects, prototypes, and trying Keykit with a real application.',
    features: [
      '500 active translation keys',
      '3 languages · 1 project',
      '2 team members · 1 connected source',
      'Automatic discovery and deprecation',
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
    maxConnectedSources: PREMIUM_MAX_CONNECTED_SOURCES,
    maxLiveRequestsPerMonth: PREMIUM_MAX_LIVE_REQUESTS_PER_MONTH,
    includedActiveKeys: PREMIUM_INCLUDED_ACTIVE_KEYS,
    activeKeyOverageCentsPerThousand:
      PREMIUM_ACTIVE_KEY_OVERAGE_CENTS_PER_THOUSAND,
    selfServe: true,
    description:
      'Everything a software team needs. Unlimited languages and seats.',
    features: [
      '3,000 active keys included',
      '+$4 per extra 1,000 active keys',
      'Unlimited languages, projects, and members',
      '5 connected sources',
      '1M live requests and static delivery',
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
    maxConnectedSources: null,
    maxLiveRequestsPerMonth: null,
    includedActiveKeys: null,
    activeKeyOverageCentsPerThousand: null,
    selfServe: false,
    description:
      'Governance, security, support, and higher committed capacity.',
    features: [
      '25,000+ active keys',
      'Unlimited languages, projects, members, and sources',
      'SAML SSO, SCIM, and audit logs',
      'SLA, onboarding, and migration help',
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

export function connectedSourceLimitMessage(max: number): string {
  const noun = max === 1 ? 'connected source' : 'connected sources';
  return (
    `Your plan includes up to ${max} ${noun}. ` +
    'Upgrade to Pro for more connected sources.'
  );
}

export function liveRequestLimitMessage(max: number): string {
  return (
    `Your plan includes up to ${max.toLocaleString('en-US')} live requests this month. ` +
    'Upgrade to Pro for a higher live-delivery allowance.'
  );
}

/**
 * Extra 1,000-key blocks above the included pool.
 * Exactly 1,000 over is one block (4,000 keys on Pro). The next key starts another.
 */
export function overageBlocks(
  activeKeys: number,
  included: number | null
): number {
  if (included === null || activeKeys <= included) {
    return 0;
  }
  return Math.ceil((activeKeys - included) / 1000);
}

/**
 * A translation key counts unless a TRANSLATION KeyMeta marks it deprecated
 * or archived. Missing KeyMeta counts. UNUSED counts. A feature-flag meta
 * does not exempt the translation key.
 */
export function countsAsActiveTranslationKey(
  meta: { type: string; lifecycle: string } | null | undefined
): boolean {
  if (!meta || meta.type !== 'TRANSLATION') {
    return true;
  }
  return !(ACTIVE_KEY_EXCLUDED_LIFECYCLES as readonly string[]).includes(
    meta.lifecycle
  );
}

/** `team:${teamId}` or `project:${projectId}` — one usage row per billing scope. */
export function planUsageScopeId(
  billingScope: BillingScope,
  teamId: string,
  projectId: string
): string {
  return billingScope === 'project' ? `project:${projectId}` : `team:${teamId}`;
}

/** UTC `YYYY-MM`. A new month starts a fresh high-water and request counter. */
export function planUsagePeriod(now = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
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
  maxConnectedSources: number | null;
  maxLiveRequestsPerMonth: number | null;
  includedActiveKeys: number | null;
  activeKeyOverageCentsPerThousand: number | null;
  selfServe: boolean;
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
    maxConnectedSources: plan.maxConnectedSources,
    maxLiveRequestsPerMonth: plan.maxLiveRequestsPerMonth,
    includedActiveKeys: plan.includedActiveKeys,
    activeKeyOverageCentsPerThousand: plan.activeKeyOverageCentsPerThousand,
    selfServe: plan.selfServe,
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
