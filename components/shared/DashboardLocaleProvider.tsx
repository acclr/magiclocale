import { KeykitProvider, useKeykit } from '@keykithq/sdk/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  publishSourceKeyLimit,
  sourceKeyLimitNotice,
} from '@/lib/keykit-source-key-limit';

import {
  DashboardI18nContext,
  type DashboardI18n,
} from '@/lib/dashboard-i18n-context';
import {
  emptyDashboardLocalePageProps,
  type DashboardLocalePageProps,
} from '@/lib/dashboard-locale';

let dashboardLocaleRequest: {
  cookie: string;
  promise: Promise<DashboardLocalePageProps>;
} | null = null;

function loadDashboardLocale(): Promise<DashboardLocalePageProps> {
  const cookie = readLocaleCookie();
  if (!dashboardLocaleRequest || dashboardLocaleRequest.cookie !== cookie) {
    dashboardLocaleRequest = {
      cookie,
      promise: fetch('/api/dashboard-locale', {
        credentials: 'same-origin',
      })
        .then((response) =>
          response.ok ? response.json() : emptyDashboardLocalePageProps
        )
        .catch(() => emptyDashboardLocalePageProps),
    };
  }

  return dashboardLocaleRequest.promise;
}

function readLocaleCookie(): string {
  if (typeof document === 'undefined') {
    return '';
  }
  const match = document.cookie.match(/(?:^|; )keykit-locale=([^;]*)/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

function ConnectedDashboardI18n({ children }: { children: ReactNode }) {
  const keykit = useKeykit();
  const value = useMemo<DashboardI18n>(
    () => ({
      locale: keykit.locale,
      translate: keykit.translate,
    }),
    [keykit]
  );

  return (
    <DashboardI18nContext.Provider value={value}>
      {children}
    </DashboardI18nContext.Provider>
  );
}

function reportKeykitError(error: Error): void {
  console.warn('[Keykit]', error.message);
  const notice = sourceKeyLimitNotice(error);
  if (notice) {
    publishSourceKeyLimit(notice);
  }
}

export function DashboardLocaleProvider({ children }: { children: ReactNode }) {
  const [dashboard, setDashboard] = useState<DashboardLocalePageProps | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    void loadDashboardLocale().then((value) => {
      if (!cancelled) {
        setDashboard(value);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!dashboard?.config) {
    return children;
  }

  return (
    <KeykitProvider
      config={{ ...dashboard.config, onError: reportKeykitError }}
      initialLocale={dashboard.locale}
      initialBundle={dashboard.initialBundle ?? undefined}
    >
      <ConnectedDashboardI18n>{children}</ConnectedDashboardI18n>
    </KeykitProvider>
  );
}
