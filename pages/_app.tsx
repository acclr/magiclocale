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

function MyApp({ Component, pageProps }: AppPropsWithLayout) {
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
    Component.getLayout || ((page) => <AccountLayout>{page}</AccountLayout>);

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
              background: '#181B1F',
              color: '#E4E6E8',
              border: '1px solid #2A2E34',
            },
          }}
        />
        <TooltipProvider>
          <Themer
            overrideTheme={{
              '--primary-color': '#EFB12A',
              '--primary-hover': '#D99C18',
              '--primary-color-50': '#FFFBEB',
              '--primary-color-100': '#FEF3C7',
              '--primary-color-200': '#FDE68A',
              '--primary-color-300': '#FCD34D',
              '--primary-color-500': '#EFB12A',
              '--primary-color-600': '#D99C18',
              '--primary-color-700': '#B45309',
              '--primary-color-800': '#92400E',
              '--primary-color-900': '#78350F',
              '--primary-color-950': '#451A03',
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
