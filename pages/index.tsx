import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import FAQSection from '@/components/defaultLanding/FAQSection';
import HeroSection from '@/components/defaultLanding/HeroSection';
import FeatureSection from '@/components/defaultLanding/FeatureSection';
import PricingSection from '@/components/defaultLanding/PricingSection';
import LandingShell from '@/components/defaultLanding/LandingShell';
import { LandingLocaleProvider } from '@/components/defaultLanding/LandingLocaleProvider';
import { useTranslate } from '@keykithq/sdk/react';
import type { LandingLocalePageProps } from '@/lib/landing-locale';
import { getLandingLocalePageProps } from '@/lib/landing-locale-server';
import env from '@/lib/env';
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
  if (env.hideLandingPage) {
    return {
      redirect: {
        destination: '/auth/login',
        permanent: true,
      },
    };
  }

  const { locale } = context;

  return {
    props: {
      landing: await getLandingLocalePageProps(context),
      ...(locale ? await serverSideTranslations(locale, ['common']) : {}),
    },
  };
};

Home.getLayout = function getLayout(page: ReactElement) {
  return <>{page}</>;
};

export default Home;
