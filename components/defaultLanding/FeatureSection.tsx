import { Card, CardContent, CardTitle } from '@/components/ui/card';

import { useLandingI18n } from './LandingLocaleProvider';
import features from './data/features.json';

const FeatureSection = () => {
  const { translate } = useLandingI18n();

  return (
    <section className="px-2 py-6">
      <div className="flex flex-col justify-center space-y-6">
        <h2 className="text-center text-4xl font-bold normal-case">
          {translate('landing.features.title', 'Features')}
        </h2>
        <p className="text-center text-xl">
          {translate(
            'landing.features.subtitle',
            'Everything you need to localize a product — including this website.'
          )}
        </p>
        <div className="flex items-center justify-center">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.id}>
                <CardContent>
                  <CardTitle>
                    {translate(
                      `landing.features.${feature.id}.name`,
                      feature.name
                    )}
                  </CardTitle>
                  <p className="mt-2">
                    {translate(
                      `landing.features.${feature.id}.description`,
                      feature.description
                    )}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
