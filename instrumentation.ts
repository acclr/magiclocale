// instrumentation.ts

import * as Sentry from '@sentry/nextjs';

const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();

export function register() {
  if (
    !sentryDsn ||
    (process.env.NEXT_RUNTIME !== 'nodejs' &&
      process.env.NEXT_RUNTIME !== 'edge')
  ) {
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    tracesSampleRate: parseFloat(
      process.env.NEXT_PUBLIC_SENTRY_TRACE_SAMPLE_RATE ?? '0.0'
    ),
    debug: false,
  });
}
