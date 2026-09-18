import type { GetServerSidePropsContext } from 'next';

import type { LandingLocalePageProps } from './landing-locale';
import { getSelfHostedLocalePageProps } from './self-hosted-locale-server';

export async function getLandingLocalePageProps(
  context: GetServerSidePropsContext
): Promise<LandingLocalePageProps> {
  return getSelfHostedLocalePageProps({
    req: context.req,
    appUrl: process.env.APP_URL ?? '',
    projectId: process.env.LOCALEKIT_LANDING_PROJECT_ID,
    ingestToken: process.env.LOCALEKIT_LANDING_API_KEY,
    sourceLocale: process.env.LOCALEKIT_LANDING_SOURCE_LOCALE,
  });
}
