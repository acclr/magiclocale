import type { IncomingMessage } from 'http';

import {
  createSelfHostedSdkConfig,
  emptySelfHostedLocalePageProps,
  ensureStaticCatalogs,
  KEYKIT_LOCALE_COOKIE,
  parseSelfHostedLocale,
  type SelfHostedLocalePageProps,
} from './self-hosted-locale';
import { buildTranslationCatalog } from './translations/translation-bundle';
import {
  getEnvironmentService,
  getTranslationRepository,
  getVersionService,
} from './translations';

type CookieRequest = Pick<IncomingMessage, 'headers'> & {
  cookies?: Partial<Record<string, string>>;
};

const LOCALE_PROPS_TTL_MS = 60_000;

type CachedLocaleProps = {
  expiresAt: number;
  value: SelfHostedLocalePageProps;
};

const localePropsCache = new Map<string, CachedLocaleProps>();

export async function getSelfHostedLocalePageProps(
  input: Parameters<typeof loadSelfHostedLocalePageProps>[0]
): Promise<SelfHostedLocalePageProps> {
  const cacheKey = [
    input.projectId ?? '',
    input.locale ?? '',
    readCookie(input.req, KEYKIT_LOCALE_COOKIE) ?? '',
  ].join('|');
  const cached = localePropsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const value = await loadSelfHostedLocalePageProps(input);
  if (value.config) {
    localePropsCache.set(cacheKey, {
      expiresAt: Date.now() + LOCALE_PROPS_TTL_MS,
      value,
    });
  }
  return value;
}

async function loadSelfHostedLocalePageProps(input: {
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
    });
    const catalogs = ensureStaticCatalogs(
      catalog.success ? catalog.catalog.locales : {},
      sourceLocale
    );
    const published = catalog.success ? catalog.catalog : null;
    const translations = published?.locales[locale];

    return {
      locale,
      locales,
      config: {
        ...config,
        sourceLocale,
        delivery: 'live',
        catalogs,
      },
      initialBundle:
        published && translations
          ? {
              projectId: published.projectId,
              environment: published.environment,
              locale,
              sourceLocale: published.sourceLocale,
              translations,
              version: published.version,
              versionNumber: published.versionNumber,
              publishedAt: published.publishedAt,
            }
          : null,
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
