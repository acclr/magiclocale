import { LocaleKitProvider, useLocaleKit } from '@localekit/sdk/react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DashboardI18nContext,
  type DashboardI18n,
} from '@/lib/dashboard-i18n-context';
import {
  emptyDashboardLocalePageProps,
  type DashboardLocalePageProps,
} from '@/lib/dashboard-locale';

let dashboardLocaleRequest: Promise<DashboardLocalePageProps> | null = null;

function loadDashboardLocale(): Promise<DashboardLocalePageProps> {
  dashboardLocaleRequest ??= fetch('/api/dashboard-locale', {
    credentials: 'same-origin',
  })
    .then((response) =>
      response.ok ? response.json() : emptyDashboardLocalePageProps
    )
    .catch(() => emptyDashboardLocalePageProps);

  return dashboardLocaleRequest;
}

function ConnectedDashboardI18n({ children }: { children: ReactNode }) {
  const localeKit = useLocaleKit();
  const value = useMemo<DashboardI18n>(
    () => ({
      locale: localeKit.locale,
      translate: localeKit.translate,
    }),
    [localeKit]
  );

  return (
    <DashboardI18nContext.Provider value={value}>
      {children}
    </DashboardI18nContext.Provider>
  );
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
    <LocaleKitProvider
      config={dashboard.config}
      initialLocale={dashboard.locale}
      initialBundle={dashboard.initialBundle ?? undefined}
    >
      <ConnectedDashboardI18n>{children}</ConnectedDashboardI18n>
    </LocaleKitProvider>
  );
}
