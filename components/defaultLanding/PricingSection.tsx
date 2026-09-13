import { CheckIcon } from '@heroicons/react/20/solid';

import { Button } from '@/components/shared';
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';

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
              <Card key={plan.id}>
                <CardContent>
                  <CardTitle>
                    {plan.currency} {plan.amount} /{' '}
                    {translate(
                      `landing.pricing.${plan.id}.duration`,
                      plan.duration
                    )}
                  </CardTitle>
                  <p className="mt-2">
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
                </CardContent>
                <CardFooter className="justify-center">
                  <Button color="primary" className="w-3/4 md:w-full" size="md">
                    {translate('landing.pricing.buy-now', 'Buy now')}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
