import { createKeykit, type KeykitPageProps } from '@keykithq/sdk/pages';
import type { GetServerSidePropsContext, GetServerSidePropsResult } from 'next';
import type { Session } from 'next-auth';

import { landingRouting, landingSite } from '@/content/landing/site';
import { getLandingLocalePageProps } from '@/lib/landing-locale-server';
import { getSession } from '@/lib/session';

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

function toClientSession(session: Session | null): Session | null {
  if (!session) {
    return null;
  }

  return JSON.parse(JSON.stringify(session)) as Session;
}

export async function getLandingServerSideProps(
  context: GetServerSidePropsContext
): Promise<
  GetServerSidePropsResult<{ keykit: KeykitPageProps; session: Session | null }>
> {
  const result = await landingKeykit.getServerSideProps(context);
  if (!('props' in result)) {
    return result;
  }

  const session = await getSession(context.req, context.res);

  return {
    props: {
      ...result.props,
      session: toClientSession(session),
    },
  };
}
