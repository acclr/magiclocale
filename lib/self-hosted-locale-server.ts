import type { IncomingMessage } from 'http';

import {
  createSelfHostedSdkConfig,
  emptySelfHostedLocalePageProps,
  LOCALEKIT_LOCALE_COOKIE,
  parseSelfHostedLocale,
  type SelfHostedLocalePageProps,
} from './self-hosted-locale';
import { buildTranslationBundle } from './translations/translation-bundle';
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
  appUrl: string;
  projectId?: string;
  ingestToken?: string;
  sourceLocale?: string;
}): Promise<SelfHostedLocalePageProps> {
  const config = createSelfHostedSdkConfig({
    appUrl: input.appUrl,
    projectId: input.projectId,
    ingestToken: input.ingestToken,
    sourceLocale: input.sourceLocale,
  });

  if (!config) {
    return emptySelfHostedLocalePageProps;
  }

  const project = await getTranslationRepository().getProject(config.projectId);
  const sourceLocale = project?.sourceLocale ?? config.sourceLocale;
  const locales =
    project?.locales.length && project.locales.length > 0
      ? project.locales
      : [sourceLocale];
  const locale = parseSelfHostedLocale(
    readCookie(input.req, LOCALEKIT_LOCALE_COOKIE),
    locales,
    sourceLocale
  );
  const result = await buildTranslationBundle(
    {
      repository: getTranslationRepository(),
      environmentService: getEnvironmentService(),
      versionService: getVersionService(),
    },
    { projectId: config.projectId, locale }
  );

  return {
    locale,
    locales,
    config: { ...config, sourceLocale },
    initialBundle: result.success ? result.bundle : null,
  };
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
