import { CheckIcon } from '@heroicons/react/20/solid';
import { Button, Card } from 'react-daisyui';

import { useLandingI18n } from './LandingLocaleProvider';
import plans from './data/pricing.json';

const PricingSection = () => {
  const { translate } = useLandingI18n();

  return (
    <section className="py-6">
      <div className="flex flex-col justify-center space-y-6">
        <h2 className="text-center text-4xl font-bold normal-case">
          {translate('landing.pricing.title', 'Pricing')}
        </h2>
        <p className="text-center text-xl">
          {translate(
            'landing.pricing.subtitle',
            'Start simple. Upgrade when your localization workflow grows.'
          )}
        </p>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="rounded-md dark:border-gray-200 border border-gray-300"
              >
                <Card.Body>
                  <Card.Title tag="h2">
                    {plan.currency} {plan.amount} /{' '}
                    {translate(
                      `landing.pricing.${plan.id}.duration`,
                      plan.duration
                    )}
                  </Card.Title>
                  <p>
                    {translate(
                      `landing.pricing.${plan.id}.description`,
                      plan.description
                    )}
                  </p>
                  <div className="mt-5">
                    <ul className="flex flex-col space-y-2">
                      {plan.benefits.map((benefit) => (
                        <li key={benefit.id} className="flex items-center">
                          <CheckIcon className="h-5 w-5" />
                          <span className="ml-1">
                            {translate(
                              `landing.pricing.${plan.id}.benefit.${benefit.id}`,
                              benefit.text
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Card.Body>
                <Card.Actions className="justify-center m-2">
                  <Button
                    color="primary"
                    className="md:w-full w-3/4 rounded-md"
                    size="md"
                  >
                    {translate('landing.pricing.buy-now', 'Buy now')}
                  </Button>
                </Card.Actions>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
