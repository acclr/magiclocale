import { createKeykit, type KeykitPageProps } from '@keykithq/sdk/pages';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';

import { landingRouting, landingSite } from '@/content/landing/site';
import { getLandingLocalePageProps } from '@/lib/landing-locale-server';

const landingKeykit = createKeykit({
  apiKey: process.env.KEYKIT_LANDING_API_KEY,
  projectId: process.env.KEYKIT_LANDING_PROJECT_ID,
  baseUrl: process.env.APP_URL ?? '',
  sourceLocale:
    process.env.KEYKIT_LANDING_SOURCE_LOCALE ?? landingSite.defaultLocale,
  delivery: 'static',
  routing: 'path',
  defaultLocale: landingRouting.defaultLocale,
  locales: landingRouting.locales,
  pages: landingRouting.pages,
  async load(locale) {
    const props = await getLandingLocalePageProps(locale);
    const catalogs = {
      ...(props.config?.catalogs ?? {}),
    };
    if (!catalogs[locale]) {
      catalogs[locale] = props.initialBundle?.translations ?? {};
    }
    return {
      bundle: props.initialBundle,
      catalogs,
      sourceCatalog: props.config?.sourceCatalog,
      sourceLocale: props.config?.sourceLocale ?? landingSite.defaultLocale,
    };
  },
});

export function getLandingServerSideProps(
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ keykit: KeykitPageProps }>> {
  return landingKeykit.getServerSideProps(context);
}
