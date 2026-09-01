import {
  customerIdForScope,
  resolveMagilocalePlan,
  MAGILOCALE_PLANS,
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
      resolveMagilocalePlan(
        ['price_starter', 'price_enterprise'],
        catalog,
        'project'
      )
    ).toMatchObject({
      planId: 'enterprise',
      subscribed: true,
      billingScope: 'project',
      maxLocales: MAGILOCALE_PLANS.enterprise.maxLocales,
    });
    expect(
      resolveMagilocalePlan(['price_starter'], catalog, 'team')
    ).toMatchObject({
      planId: 'starter',
      subscribed: true,
      billingScope: 'team',
    });
    expect(resolveMagilocalePlan([], catalog, 'team')).toMatchObject({
      planId: 'starter',
      subscribed: false,
      billingScope: 'team',
    });
  });
});
