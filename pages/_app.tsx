import '@/lib/public-app-url';
import app from '@/lib/app';
import { SessionProvider } from 'next-auth/react';
import { appWithTranslation } from 'next-i18next';
import Head from 'next/head';
import { Toaster } from 'react-hot-toast';
import type { AppPropsWithLayout } from 'types';
import mixpanel from 'mixpanel-browser';

import '@boxyhq/react-ui/dist/react-ui.css';
import '../styles/globals.css';
import { useEffect } from 'react';
import { DashboardLocaleProvider } from '@/components/shared/DashboardLocaleProvider';
import env from '@/lib/env';
import { Themer } from '@boxyhq/react-ui/shared';
import { AccountLayout } from '@/components/layouts';
import { TooltipProvider } from '@/components/ui/tooltip';

function MyApp({ Component, pageProps, router }: AppPropsWithLayout) {
  const { session, ...props } = pageProps;

  // Add mixpanel
  useEffect(() => {
    if (env.mixpanel.token) {
      mixpanel.init(env.mixpanel.token, {
        debug: true,
        ignore_dnt: true,
        track_pageview: true,
      });
    }
  }, []);

  const getLayout =
    Component.getLayout ||
    (router.pathname === '/'
      ? (page) => page
      : (page) => <AccountLayout>{page}</AccountLayout>);

  return (
    <>
      <Head>
        <title>{app.name}</title>
        <link rel="icon" href="https://boxyhq.com/img/favicon.ico" />
      </Head>
      <SessionProvider session={session}>
        <Toaster
          toastOptions={{
            duration: 4000,
            style: {
              background: '#141416',
              color: '#ececee',
              border: '1px solid #2e2e32',
            },
          }}
        />
        <TooltipProvider>
          <Themer
            overrideTheme={{
              '--primary-color': '#FF5900',
              '--primary-hover': '#CC3E02',
              '--primary-color-50': '#FFF7EC',
              '--primary-color-100': '#FFECD3',
              '--primary-color-200': '#FFD6A5',
              '--primary-color-300': '#FFB96D',
              '--primary-color-500': '#FF700A',
              '--primary-color-600': '#FF5900',
              '--primary-color-700': '#CC3E02',
              '--primary-color-800': '#A1320B',
              '--primary-color-900': '#822B0C',
              '--primary-color-950': '#461304',
            }}
          >
            <DashboardLocaleProvider>
              {getLayout(<Component {...props} />)}
            </DashboardLocaleProvider>
          </Themer>
        </TooltipProvider>
      </SessionProvider>
    </>
  );
}

export default appWithTranslation<never>(MyApp);
