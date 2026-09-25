import {
  KEYKIT_PLANS,
  FREE_MAX_TEAM_MEMBERS,
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
      maxTeamMembers: FREE_MAX_TEAM_MEMBERS,
      maxProjects: KEYKIT_PLANS.free.maxProjects,
    });
  });

  it('resolves enterprise over premium for the billed customer', () => {
    expect(
      resolveKeykitPlan(['price_premium', 'price_enterprise'], catalog, 'team')
    ).toMatchObject({
      planId: 'enterprise',
      subscribed: true,
      maxLocales: KEYKIT_PLANS.enterprise.maxLocales,
      maxEnvironments: KEYKIT_PLANS.enterprise.maxEnvironments,
      maxFlags: KEYKIT_PLANS.enterprise.maxFlags,
    });
    expect(resolveKeykitPlan(['price_premium'], catalog, 'team')).toMatchObject(
      {
        planId: 'premium',
        subscribed: true,
        maxLocales: KEYKIT_PLANS.premium.maxLocales,
      }
    );
  });
});
