import Link from 'next/link';

import { useLandingI18n } from './LandingLocaleProvider';

const HeroSection = () => {
  const { translate } = useLandingI18n();

  return (
    <div className="hero py-52">
      <div className="hero-content text-center">
        <div className="max-w-7xl">
          <h1 className="text-5xl font-bold">
            {translate('landing.hero.title', 'Magilocale')}
          </h1>
          <p className="py-6 text-2xl font-normal">
            {translate(
              'landing.hero.subtitle',
              'Ship product copy in every language. Edit translations in the dashboard, and this page updates live.'
            )}
          </p>
          <div className="flex items-center justify-center gap-2 ">
            <Link
              href="/auth/join"
              className="btn btn-primary px-8 no-underline"
            >
              {translate('landing.hero.get-started', 'Get started')}
            </Link>
            <Link
              href="https://github.com/boxyhq/saas-starter-kit"
              className="btn btn-outline px-8"
            >
              {translate('landing.hero.github', 'GitHub')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
