import Head from 'next/head';

import { useKeykit } from '@keykithq/sdk/react';

import FAQSection from './FAQSection';
import FeatureSection from './FeatureSection';
import HeroSection from './HeroSection';
import LandingShell from './LandingShell';
import PricingSection from './PricingSection';

const LandingHome = () => {
  const { translate } = useKeykit();

  return (
    <>
      <Head>
        <title>
          {translate('landing.meta.title', 'Keykit — product copy, localized')}
        </title>
        <meta
          name="description"
          content={translate(
            'landing.meta.description',
            'Discover translation keys, review copy with your team, and ship every locale from one dashboard.'
          )}
        />
      </Head>

      <LandingShell>
        <HeroSection />
        <FeatureSection />
        <PricingSection />
        <FAQSection />
      </LandingShell>
    </>
  );
};

export default LandingHome;
