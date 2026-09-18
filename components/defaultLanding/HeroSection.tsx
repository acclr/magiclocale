import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { useLandingI18n } from './LandingLocaleProvider';

const HeroSection = () => {
  const { translate } = useLandingI18n();

  return (
    <div className="flex items-center justify-center py-52">
      <div className="text-center">
        <div className="max-w-7xl">
          <h1 className="text-5xl font-bold">
            {translate('landing.hero.title', 'LocaleKit')}
          </h1>
          <p className="py-6 text-2xl font-normal">
            {translate(
              'landing.hero.subtitle',
              'Ship product copy in every language. Edit translations in the dashboard, and this page updates live.'
            )}
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button asChild className="px-8">
              <Link href="/auth/join">
                {translate('landing.hero.get-started', 'Get started')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="px-8">
              <Link href="https://github.com/boxyhq/saas-starter-kit">
                {translate('landing.hero.github', 'GitHub')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
