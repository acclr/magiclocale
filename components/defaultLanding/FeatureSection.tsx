import { useKeykit } from '@keykithq/sdk/react';

import features from './data/features.json';
import LandingSection from './LandingSection';
import Reveal from './Reveal';

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
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <Reveal key={feature.id} delay={index * 60}>
            <div className="flex h-full flex-col rounded-xl bg-surface p-7 transition-colors hover:bg-elevated">
              <span className="font-mono text-xs text-muted-foreground">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {translate(`landing.features.${feature.id}.name`, feature.name)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {translate(
                  `landing.features.${feature.id}.description`,
                  feature.description
                )}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </LandingSection>
  );
};

export default FeatureSection;
