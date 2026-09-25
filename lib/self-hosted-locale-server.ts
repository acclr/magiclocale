import type { IncomingMessage } from 'http';

import {
  createSelfHostedSdkConfig,
  emptySelfHostedLocalePageProps,
  ensureStaticCatalogs,
  KEYKIT_LOCALE_COOKIE,
  parseSelfHostedLocale,
  type SelfHostedLocalePageProps,
} from './self-hosted-locale';
import {
  buildTranslationBundle,
  buildTranslationCatalog,
} from './translations/translation-bundle';
import {
  getEnvironmentService,
  getTranslationRepository,
  getVersionService,
} from './translations';

type CookieRequest = Pick<IncomingMessage, 'headers'> & {
  cookies?: Partial<Record<string, string>>;
};

export async function getSelfHostedLocalePageProps(input: {
  req?: CookieRequest;
  /** URL locale. When set, it wins over the locale cookie. */
  locale?: string;
  appUrl: string;
  projectId?: string;
  ingestToken?: string;
  sourceLocale?: string;
  sourceCatalog?: Record<string, string>;
}): Promise<SelfHostedLocalePageProps> {
  try {
    const config = createSelfHostedSdkConfig({
      appUrl: input.appUrl,
      projectId: input.projectId,
      ingestToken: input.ingestToken,
      sourceLocale: input.sourceLocale,
      sourceCatalog: input.sourceCatalog,
    });

    if (!config) {
      return emptySelfHostedLocalePageProps;
    }

    const project = await getTranslationRepository().getProject(
      config.projectId
    );
    const sourceLocale = project?.sourceLocale ?? config.sourceLocale;
    const locales =
      project?.locales.length && project.locales.length > 0
        ? project.locales
        : [sourceLocale];
    const requestedLocale = input.locale?.trim();
    const locale = requestedLocale
      ? requestedLocale
      : parseSelfHostedLocale(
          readCookie(input.req, KEYKIT_LOCALE_COOKIE),
          locales,
          sourceLocale
        );
    const dependencies = {
      repository: getTranslationRepository(),
      environmentService: getEnvironmentService(),
      versionService: getVersionService(),
    };
    const catalog = await buildTranslationCatalog(dependencies, {
      projectId: config.projectId,
      workingCopy: true,
    });
    const catalogs = ensureStaticCatalogs(
      catalog.success ? catalog.catalog.locales : {},
      sourceLocale
    );
    const result = await buildTranslationBundle(dependencies, {
      projectId: config.projectId,
      locale,
      workingCopy: true,
    });

    return {
      locale,
      locales,
      config: {
        ...config,
        sourceLocale,
        delivery: 'static',
        catalogs,
        refreshIntervalMs: 0,
      },
      initialBundle: result.success ? result.bundle : null,
    };
  } catch (error) {
    console.error('[keykit] Failed to load self-hosted locale props', error);
    return emptySelfHostedLocalePageProps;
  }
}

function readCookie(
  req: CookieRequest | undefined,
  name: string
): string | undefined {
  const fromCookies = req?.cookies?.[name];
  if (fromCookies) {
    return fromCookies;
  }

  const header = req?.headers.cookie;
  if (!header) {
    return undefined;
  }

  for (const part of header.split(';')) {
    const [rawName, ...rest] = part.split('=');
    if (rawName?.trim() === name) {
      return decodeURIComponent(rest.join('=').trim());
    }
  }

  return undefined;
}
