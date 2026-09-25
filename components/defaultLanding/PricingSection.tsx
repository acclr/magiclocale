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
import { useTranslate } from '@keykithq/sdk/react';

const PricingSection = () => {
  const { t } = useTranslate();

  return (
    <LandingSection
      id="pricing"
      eyebrow={t('landing.pricing.eyebrow', 'Plans')}
      title={t('landing.pricing.title', 'Simple monthly pricing')}
      description={t(
        'landing.pricing.subtitle',
        'Start free with a teammate. Upgrade to Premium or Enterprise as you grow.'
      )}
    >
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-3">
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
                {t('landing.pricing.popular', 'Popular')}
              </Badge>
            ) : null}
            <CardHeader className="gap-2 pb-2">
              <CardTitle className="font-heading text-lg capitalize">
                {t(`landing.pricing.${plan.id}.name`, plan.id)}
              </CardTitle>
              <div className="flex items-baseline gap-1">
                <span className="font-heading text-4xl font-semibold tracking-tight">
                  ${plan.amount}
                </span>
                <span className="text-sm text-muted-foreground">
                  / {t(`landing.pricing.${plan.id}.duration`, plan.duration)}
                </span>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {t(`landing.pricing.${plan.id}.description`, plan.description)}
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
                      {t(
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
                  {t('landing.pricing.get-started', 'Get started')}
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
