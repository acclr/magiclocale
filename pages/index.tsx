import Link from 'next/link';
import { type ReactElement } from 'react';
import type { NextPageWithLayout } from 'types';
import { GetServerSidePropsContext } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import FAQSection from '@/components/defaultLanding/FAQSection';
import HeroSection from '@/components/defaultLanding/HeroSection';
import FeatureSection from '@/components/defaultLanding/FeatureSection';
import PricingSection from '@/components/defaultLanding/PricingSection';
import LandingLocaleSwitcher from '@/components/defaultLanding/LandingLocaleSwitcher';
import {
  LandingLocaleProvider,
  useLandingI18n,
} from '@/components/defaultLanding/LandingLocaleProvider';
import type { LandingLocalePageProps } from '@/lib/landing-locale';
import { getLandingLocalePageProps } from '@/lib/landing-locale-server';
import env from '@/lib/env';
import Head from 'next/head';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type HomeProps = {
  landing: LandingLocalePageProps;
};

const HomeContent = () => {
  const { translate } = useLandingI18n();

  return (
    <>
      <Head>
        <title>
          {translate(
            'landing.meta.title',
            'LocaleKit — product copy, localized'
          )}
        </title>
      </Head>

      <div className="container mx-auto">
        <div className="flex items-center bg-background px-0 sm:px-1">
          <div className="flex-1">
            <Button asChild variant="ghost" className="text-xl">
              <Link href="/">
                {translate('landing.nav.brand', 'LocaleKit')}
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <LandingLocaleSwitcher />
            <Button asChild>
              <Link href="/auth/join">
                {translate('landing.nav.sign-up', 'Sign up')}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/login">
                {translate('landing.nav.sign-in', 'Sign in')}
              </Link>
            </Button>
          </div>
        </div>
        <HeroSection />
        <Separator className="my-4" />
        <FeatureSection />
        <Separator className="my-4" />
        <PricingSection />
        <Separator className="my-4" />
        <FAQSection />
      </div>
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
