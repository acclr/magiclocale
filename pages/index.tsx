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
import useTheme from 'hooks/useTheme';
import env from '@/lib/env';
import Head from 'next/head';

type HomeProps = {
  landing: LandingLocalePageProps;
};

const HomeContent = () => {
  const { toggleTheme, selectedTheme } = useTheme();
  const { translate } = useLandingI18n();

  return (
    <>
      <Head>
        <title>
          {translate(
            'landing.meta.title',
            'Magilocale — product copy, localized'
          )}
        </title>
      </Head>

      <div className="container mx-auto">
        <div className="navbar bg-base-100 px-0 sm:px-1">
          <div className="flex-1">
            <Link href="/" className="btn btn-ghost text-xl normal-case">
              {translate('landing.nav.brand', 'Magilocale')}
            </Link>
          </div>
          <div className="flex-none">
            <ul className="menu menu-horizontal flex items-center gap-2 sm:gap-4">
              <li>
                <LandingLocaleSwitcher />
              </li>
              {env.darkModeEnabled && (
                <li>
                  <button
                    className="bg-none p-0 rounded-lg flex items-center justify-center"
                    onClick={toggleTheme}
                  >
                    <selectedTheme.icon className="w-5 h-5" />
                  </button>
                </li>
              )}
              <li>
                <Link
                  href="/auth/join"
                  className="btn btn-primary btn-md py-3 px-2 sm:px-4 text-white"
                >
                  {translate('landing.nav.sign-up', 'Sign up')}
                </Link>
              </li>
              <li>
                <Link
                  href="/auth/login"
                  className="btn btn-primary dark:border-zinc-600 dark:border-2 dark:text-zinc-200 btn-outline py-3 px-2 sm:px-4 btn-md"
                >
                  {translate('landing.nav.sign-in', 'Sign in')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <HeroSection />
        <div className="divider"></div>
        <FeatureSection />
        <div className="divider"></div>
        <PricingSection />
        <div className="divider"></div>
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
