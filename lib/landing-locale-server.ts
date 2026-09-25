import type { LandingLocalePageProps } from './landing-locale';
import { emptySelfHostedLocalePageProps } from './self-hosted-locale';
import { getSelfHostedLocalePageProps } from './self-hosted-locale-server';

export async function getLandingLocalePageProps(
  locale: string
): Promise<LandingLocalePageProps> {
  try {
    return await getSelfHostedLocalePageProps({
      locale,
      appUrl: process.env.APP_URL ?? '',
      projectId: process.env.KEYKIT_LANDING_PROJECT_ID,
      ingestToken: process.env.KEYKIT_LANDING_API_KEY,
      sourceLocale: process.env.KEYKIT_LANDING_SOURCE_LOCALE,
    });
  } catch (error) {
    console.error('[keykit] Failed to load landing locale props', error);
    return emptySelfHostedLocalePageProps;
  }
}
