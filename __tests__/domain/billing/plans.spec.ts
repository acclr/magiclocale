import {
  customerIdForScope,
  resolveLocaleKitPlan,
  LOCALEKIT_PLANS,
} from '../../../domain/billing';

const catalog = {
  starter: 'price_starter',
  enterprise: 'price_enterprise',
};

describe('billing scope and plans', () => {
  it('uses the project Stripe customer only for per-project billing', () => {
    expect(customerIdForScope('team', 'cus_team', 'cus_project')).toBe(
      'cus_team'
    );
    expect(customerIdForScope('project', 'cus_team', 'cus_project')).toBe(
      'cus_project'
    );
    expect(customerIdForScope('project', 'cus_team', null)).toBeNull();
  });

  it('resolves enterprise over starter for the billed customer', () => {
    expect(
      resolveLocaleKitPlan(
        ['price_starter', 'price_enterprise'],
        catalog,
        'project'
      )
    ).toMatchObject({
      planId: 'enterprise',
      subscribed: true,
      billingScope: 'project',
      maxLocales: LOCALEKIT_PLANS.enterprise.maxLocales,
      maxEnvironments: LOCALEKIT_PLANS.enterprise.maxEnvironments,
      maxFlags: LOCALEKIT_PLANS.enterprise.maxFlags,
    });
    expect(
      resolveLocaleKitPlan(['price_starter'], catalog, 'team')
    ).toMatchObject({
      planId: 'starter',
      subscribed: true,
      billingScope: 'team',
    });
    expect(resolveLocaleKitPlan([], catalog, 'team')).toMatchObject({
      planId: 'starter',
      subscribed: false,
      billingScope: 'team',
    });
  });
});
