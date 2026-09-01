import type { GetServerSidePropsContext } from 'next';

import { PrismaTranslationRepository } from '../data/translations/prisma-translation-repository';
import { prisma } from './prisma';
import { buildTranslationBundle } from './translations/translation-bundle';
import {
  createLandingSdkConfig,
  LANDING_LOCALE_COOKIE,
  parseLandingLocale,
  type LandingLocalePageProps,
} from './landing-locale';

const repository = new PrismaTranslationRepository(prisma);

export async function getLandingLocalePageProps(
  context: GetServerSidePropsContext
): Promise<LandingLocalePageProps> {
  const config = createLandingSdkConfig({
    appUrl: process.env.APP_URL ?? '',
    projectId: process.env.MAGILOCALE_LANDING_PROJECT_ID,
    ingestToken: process.env.MAGILOCALE_LANDING_API_KEY,
    sourceLocale: process.env.MAGILOCALE_LANDING_SOURCE_LOCALE,
  });

  if (!config) {
    return {
      locale: 'en',
      locales: ['en'],
      config: null,
      initialBundle: null,
    };
  }

  const project = await repository.getProject(config.projectId);
  const sourceLocale = project?.sourceLocale ?? config.sourceLocale;
  const locales =
    project?.locales.length && project.locales.length > 0
      ? project.locales
      : [sourceLocale];
  const locale = parseLandingLocale(
    context.req.cookies[LANDING_LOCALE_COOKIE],
    locales,
    sourceLocale
  );
  const result = await buildTranslationBundle(
    repository,
    config.projectId,
    locale
  );

  return {
    locale,
    locales,
    config: { ...config, sourceLocale },
    initialBundle: result.success ? result.bundle : null,
  };
}
