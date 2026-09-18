import Link from 'next/link';
import { CheckIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from 'cn';

import plans from './data/pricing.json';
import LandingSection from './LandingSection';
import { useLandingI18n } from './LandingLocaleProvider';

const PricingSection = () => {
  const { translate } = useLandingI18n();

  return (
    <LandingSection
      id="pricing"
      eyebrow={translate('landing.pricing.eyebrow', 'Plans')}
      title={translate('landing.pricing.title', 'Simple monthly pricing')}
      description={translate(
        'landing.pricing.subtitle',
        'Start on Starter. Move to Enterprise when you need more languages or headroom.'
      )}
    >
      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={cn(
              'relative flex flex-col border-border/70 bg-card/90',
              plan.highlight &&
                'border-primary/50 shadow-lg shadow-primary/10 ring-1 ring-primary/25'
            )}
          >
            {plan.highlight ? (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                {translate('landing.pricing.popular', 'Popular')}
              </Badge>
            ) : null}
            <CardHeader className="gap-2 pb-2">
              <CardTitle className="font-heading text-lg capitalize">
                {translate(`landing.pricing.${plan.id}.name`, plan.id)}
              </CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-semibold tracking-tight">
                  ${plan.amount}
                </span>
                <span className="text-sm text-muted-foreground">
                  /{' '}
                  {translate(
                    `landing.pricing.${plan.id}.duration`,
                    plan.duration
                  )}
                </span>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {translate(
                  `landing.pricing.${plan.id}.description`,
                  plan.description
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {plan.benefits.map((benefit) => (
                  <li key={benefit.id} className="flex gap-2 text-sm">
                    <CheckIcon
                      className="mt-0.5 size-4 shrink-0 text-primary"
                      aria-hidden
                    />
                    <span className="text-muted-foreground">
                      {translate(
                        `landing.pricing.${plan.id}.benefit.${benefit.id}`,
                        benefit.text
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-2">
              <Button
                asChild
                className="w-full"
                variant={plan.highlight ? 'default' : 'outline'}
              >
                <Link href="/auth/join">
                  {translate('landing.pricing.get-started', 'Get started')}
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </LandingSection>
  );
};

export default PricingSection;
