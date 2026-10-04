import {
  ACTIVE_KEY_EXCLUDED_LIFECYCLES,
  FREE_MAX_LIVE_REQUESTS_PER_MONTH,
  FREE_MAX_TEAM_MEMBERS,
  KEYKIT_PLANS,
  PREMIUM_ACTIVE_KEY_OVERAGE_CENTS_PER_THOUSAND,
  PREMIUM_INCLUDED_ACTIVE_KEYS,
  connectedSourceLimitMessage,
  countsAsActiveTranslationKey,
  HOUSE_TEAM_SLUG,
  inclusiveTeamEntitlement,
  liveRequestLimitMessage,
  teamIsInclusive,
  overageBlocks,
  planUsagePeriod,
  planUsageScopeId,
  resolveKeykitPlan,
} from '../../../domain/billing';

const catalog = {
  premium: 'price_premium',
  enterprise: 'price_enterprise',
};

describe('resolveKeykitPlan', () => {
  it('defaults to the free tier without a subscription', () => {
    expect(resolveKeykitPlan([], catalog, 'team')).toMatchObject({
      planId: 'free',
      subscribed: false,
      selfServe: true,
      maxTeamMembers: FREE_MAX_TEAM_MEMBERS,
      maxProjects: KEYKIT_PLANS.free.maxProjects,
      maxConnectedSources: 1,
      maxLiveRequestsPerMonth: FREE_MAX_LIVE_REQUESTS_PER_MONTH,
      includedActiveKeys: 500,
      activeKeyOverageCentsPerThousand: null,
      maxSourceKeysPerProject: 500,
      maxEnvironments: null,
      maxFlags: null,
    });
  });

  it('resolves enterprise over premium for the billed customer', () => {
    expect(
      resolveKeykitPlan(['price_premium', 'price_enterprise'], catalog, 'team')
    ).toMatchObject({
      planId: 'enterprise',
      subscribed: true,
      selfServe: false,
      includedActiveKeys: null,
      maxConnectedSources: null,
      maxLiveRequestsPerMonth: null,
      maxLocales: KEYKIT_PLANS.enterprise.maxLocales,
      maxEnvironments: KEYKIT_PLANS.enterprise.maxEnvironments,
      maxFlags: KEYKIT_PLANS.enterprise.maxFlags,
    });
    expect(resolveKeykitPlan(['price_premium'], catalog, 'team')).toMatchObject(
      {
        planId: 'premium',
        subscribed: true,
        selfServe: true,
        maxLocales: null,
        maxSourceKeysPerProject: null,
        includedActiveKeys: PREMIUM_INCLUDED_ACTIVE_KEYS,
        activeKeyOverageCentsPerThousand:
          PREMIUM_ACTIVE_KEY_OVERAGE_CENTS_PER_THOUSAND,
        maxConnectedSources: 5,
        maxLiveRequestsPerMonth: 1_000_000,
      }
    );
  });
});

describe('landing plan copy', () => {
  it('matches the public pricing bullets', () => {
    expect(KEYKIT_PLANS.free.features).toEqual([
      '500 active translation keys',
      '3 languages · 1 project',
      '2 team members · 1 connected source',
      'Automatic discovery and deprecation',
      'Static delivery and limited live delivery',
    ]);
    expect(KEYKIT_PLANS.premium.description).toBe(
      'Everything a software team needs. Unlimited languages and seats.'
    );
    expect(KEYKIT_PLANS.premium.features).toEqual([
      '3,000 active keys included',
      '+$4 per extra 1,000 active keys',
      'Unlimited languages, projects, and members',
      '5 connected sources',
      '1M live requests and static delivery',
      'Deprecated and archived keys are free',
    ]);
    expect(KEYKIT_PLANS.enterprise.description).toBe(
      'Governance, security, support, and higher committed capacity.'
    );
    expect(KEYKIT_PLANS.enterprise.features).toEqual([
      '25,000+ active keys',
      'Unlimited languages, projects, members, and sources',
      'SAML SSO, SCIM, and audit logs',
      'SLA, onboarding, and migration help',
    ]);
    expect(KEYKIT_PLANS.free.selfServe).toBe(true);
    expect(KEYKIT_PLANS.premium.selfServe).toBe(true);
    expect(KEYKIT_PLANS.enterprise.selfServe).toBe(false);
  });
});

describe('overageBlocks', () => {
  it('bills a block only after the included pool is passed', () => {
    expect(overageBlocks(3_000, 3_000)).toBe(0);
    expect(overageBlocks(3_001, 3_000)).toBe(1);
    expect(overageBlocks(4_000, 3_000)).toBe(1);
    expect(overageBlocks(4_001, 3_000)).toBe(2);
    expect(overageBlocks(5_000, null)).toBe(0);
    expect(overageBlocks(0, null)).toBe(0);
  });
});

describe('plan limit messages', () => {
  it('names the connected-source and live-request caps', () => {
    expect(connectedSourceLimitMessage(1)).toContain('1 connected source');
    expect(connectedSourceLimitMessage(5)).toContain('5 connected sources');
    expect(liveRequestLimitMessage(100_000)).toContain('100,000');
    expect(liveRequestLimitMessage(1_000_000)).toContain('1,000,000');
  });
});

describe('active translation keys', () => {
  it('counts missing meta and UNUSED, and skips deprecated and archived', () => {
    expect(ACTIVE_KEY_EXCLUDED_LIFECYCLES).toEqual(['DEPRECATED', 'ARCHIVED']);
    expect(countsAsActiveTranslationKey(null)).toBe(true);
    expect(countsAsActiveTranslationKey(undefined)).toBe(true);
    expect(
      countsAsActiveTranslationKey({ type: 'TRANSLATION', lifecycle: 'ACTIVE' })
    ).toBe(true);
    expect(
      countsAsActiveTranslationKey({ type: 'TRANSLATION', lifecycle: 'UNUSED' })
    ).toBe(true);
    expect(
      countsAsActiveTranslationKey({
        type: 'TRANSLATION',
        lifecycle: 'DEPRECATED',
      })
    ).toBe(false);
    expect(
      countsAsActiveTranslationKey({
        type: 'TRANSLATION',
        lifecycle: 'ARCHIVED',
      })
    ).toBe(false);
    expect(
      countsAsActiveTranslationKey({
        type: 'FEATURE_FLAG',
        lifecycle: 'DEPRECATED',
      })
    ).toBe(true);
  });
});

describe('plan usage identity', () => {
  it('scopes usage to the billing account and a UTC month', () => {
    expect(planUsageScopeId('team', 'team_1', 'project_1')).toBe('team:team_1');
    expect(planUsageScopeId('project', 'team_1', 'project_1')).toBe(
      'project:project_1'
    );
    expect(planUsagePeriod(new Date('2026-03-01T00:30:00+02:00'))).toBe(
      '2026-02'
    );
    expect(planUsagePeriod(new Date(Date.UTC(2026, 9, 4)))).toBe('2026-10');
  });
});

describe('inclusive house team', () => {
  it('grants the company team and any team marked inclusive', () => {
    expect(teamIsInclusive({ slug: HOUSE_TEAM_SLUG, inclusive: false })).toBe(
      true
    );
    expect(teamIsInclusive({ slug: 'other', inclusive: true })).toBe(true);
    expect(teamIsInclusive({ slug: 'other', inclusive: false })).toBe(false);
  });

  it('resolves as Enterprise with no key, seat, or request caps', () => {
    expect(inclusiveTeamEntitlement('team')).toMatchObject({
      planId: 'enterprise',
      subscribed: true,
      priceId: null,
      maxTeamMembers: null,
      maxProjects: null,
      maxLocales: null,
      maxSourceKeysPerProject: null,
      includedActiveKeys: null,
      maxConnectedSources: null,
      maxLiveRequestsPerMonth: null,
      activeKeyOverageCentsPerThousand: null,
    });
  });
});
