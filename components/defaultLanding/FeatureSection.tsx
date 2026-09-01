import { useLandingI18n } from './LandingLocaleProvider';

import features from './data/features.json';

const FeatureSection = () => {
  const { translate } = useLandingI18n();

  return (
    <section className="py-6 px-2">
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
          <div className="grid grid-cols-1 xl:grid-cols-3 md:grid-cols-2 gap-2">
            {features.map((feature) => (
              <div
                className="card-compact card dark:border-gray-200 border border-gray-300"
                key={feature.id}
              >
                <div className="card-body">
                  <h2 className="card-title">
                    {translate(
                      `landing.features.${feature.id}.name`,
                      feature.name
                    )}
                  </h2>
                  <p>
                    {translate(
                      `landing.features.${feature.id}.description`,
                      feature.description
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureSection;
