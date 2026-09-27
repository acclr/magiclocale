import Link from 'next/link';
import { CheckIcon } from 'lucide-react';

import { cn } from 'cn';
import { useKeykit } from '@keykithq/sdk/react';

import plans from './data/pricing.json';
import LandingSection from './LandingSection';
import Reveal from './Reveal';

const PricingSection = () => {
  const { translate } = useKeykit();

  return (
    <LandingSection
      id="pricing"
      eyebrow={translate('landing.pricing.eyebrow', 'Plans')}
      title={translate(
        'landing.pricing.headline',
        'Pay for what your product uses'
      )}
      description={translate(
        'landing.pricing.lead',
        'Unlimited languages and team members on Pro. Active keys are the meter. Deprecated and archived keys never count.'
      )}
    >
      <div className="mx-auto w-full grid gap-3 md:grid-cols-3">
        {plans.map((plan, index) => (
          <Reveal key={plan.id} delay={index * 60}>
            <div
              className={cn(
                'flex h-full flex-col rounded-xl p-7',
                plan.highlight ? 'bg-elevated' : 'bg-surface'
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {translate(`landing.pricing.${plan.id}.label`, plan.name)}
                </h3>
                {plan.highlight ? (
                  <span className="rounded-lg bg-primary/15 px-2.5 py-0.5 font-mono text-[10px] text-primary">
                    {translate('landing.pricing.popular', 'Popular')}
                  </span>
                ) : null}
              </div>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {plan.pricePrefix
                    ? `${translate(
                        `landing.pricing.${plan.id}.prefix`,
                        plan.pricePrefix
                      )} `
                    : null}
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
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {translate(
                  `landing.pricing.${plan.id}.summary`,
                  plan.description
                )}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
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
              <Link
                href="/auth/join"
                className={cn(
                  'mt-8 inline-flex w-full items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold transition-colors',
                  plan.highlight
                    ? 'bg-primary text-primary-foreground hover:bg-primary/80'
                    : 'bg-background/60 text-foreground hover:bg-background'
                )}
              >
                {translate('landing.pricing.get-started', 'Get started')}
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  );
};

export default PricingSection;
