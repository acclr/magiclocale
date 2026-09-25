import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import FAQSection from '@/components/defaultLanding/FAQSection';
import HeroSection from '@/components/defaultLanding/HeroSection';
import FeatureSection from '@/components/defaultLanding/FeatureSection';
import PricingSection from '@/components/defaultLanding/PricingSection';
import LandingShell from '@/components/defaultLanding/LandingShell';
import { LandingLocaleProvider } from '@/components/defaultLanding/LandingLocaleProvider';
import { useTranslate } from '@keykithq/sdk/react';
import type { LandingLocalePageProps } from '@/lib/landing-locale';
import { getLandingLocalePageProps } from '@/lib/landing-locale-server';
import Head from 'next/head';

type HomeProps = {
  landing: LandingLocalePageProps;
};

const HomeContent = () => {
  const { t } = useTranslate();

  return (
    <>
      <Head>
        <title>
          {t('landing.meta.title', 'Keykit — product copy, localized')}
        </title>
        <meta
          name="description"
          content={t(
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

const Home: NextPageWithLayout<HomeProps> = ({ landing }) => {
  return (
    <LandingLocaleProvider landing={landing}>
      <HomeContent />
    </LandingLocaleProvider>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  return {
    props: {
      landing: await getLandingLocalePageProps(context),
    },
  };
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export default Home;
