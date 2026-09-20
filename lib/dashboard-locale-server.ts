import type { IncomingMessage } from 'http';

import type { DashboardLocalePageProps } from './dashboard-locale';
import { emptySelfHostedLocalePageProps } from './self-hosted-locale';
import { getSelfHostedLocalePageProps } from './self-hosted-locale-server';

export async function getDashboardLocalePageProps(context: {
  req?: IncomingMessage & { cookies?: Partial<Record<string, string>> };
}): Promise<DashboardLocalePageProps> {
  if (!context.req) {
    return emptySelfHostedLocalePageProps;
  }

  return getSelfHostedLocalePageProps({
    req: context.req,
    appUrl: process.env.APP_URL ?? '',
    projectId: process.env.KEYKIT_DASHBOARD_PROJECT_ID,
    ingestToken: process.env.KEYKIT_DASHBOARD_API_KEY,
    sourceLocale: process.env.KEYKIT_DASHBOARD_SOURCE_LOCALE,
  });
}
