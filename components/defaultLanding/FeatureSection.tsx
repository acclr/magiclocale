import type { LucideIcon } from 'lucide-react';
import {
  BotIcon,
  CreditCardIcon,
  GlobeIcon,
  LayersIcon,
  LayoutDashboardIcon,
  SparklesIcon,
} from 'lucide-react';

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from 'cn';

import features from './data/features.json';
import LandingSection from './LandingSection';
import { useKeykit } from '@keykithq/sdk/react';

const featureIcons: Record<string, LucideIcon> = {
  discovery: SparklesIcon,
  dashboard: LayoutDashboardIcon,
  sdk: GlobeIcon,
  environments: LayersIcon,
  'ai-assist': BotIcon,
  billing: CreditCardIcon,
};

const FeatureSection = () => {
  const { translate } = useKeykit();

  return (
    <LandingSection
      id="features"
      eyebrow={translate('landing.features.eyebrow', 'Platform')}
      title={translate('landing.features.title', 'Built for product teams')}
      description={translate(
        'landing.features.subtitle',
        'Everything you need to localize application copy — including this marketing site.'
      )}
      className="border-t border-border/40 bg-muted/15"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = featureIcons[feature.id] ?? SparklesIcon;
          return (
            <Card
              key={feature.id}
              className="border-border/70 bg-card/80 transition-colors hover:border-primary/35 hover:bg-card"
            >
              <CardHeader className="gap-3">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-primary'
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                </div>
                <CardTitle className="text-base">
                  {translate(
                    `landing.features.${feature.id}.name`,
                    feature.name
                  )}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  {translate(
                    `landing.features.${feature.id}.description`,
                    feature.description
                  )}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </LandingSection>
  );
};

export default FeatureSection;
