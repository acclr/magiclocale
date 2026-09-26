'use client';

import { useCallback, useEffect, type ReactNode } from 'react';

import { hrefForLocale } from './locale-path';
import type { KeykitPageProps } from './pages-request';
import { KeykitProvider as KeykitReactProvider } from './react';

export function KeykitProvider({
  keykit,
  children,
}: {
  keykit: KeykitPageProps;
  children: ReactNode;
}) {
  const routing = keykit.routing;

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    document.documentElement.lang = keykit.locale;
  }, [keykit.locale]);

  const onSetLocale = useCallback(
    (locale: string) => {
      persistLocaleCookie(locale);
      if (!routing || typeof window === 'undefined') {
        return false;
      }
      const href = hrefForLocale(window.location.pathname, locale, routing);
      if (href === window.location.pathname) {
        return false;
      }
      window.location.assign(href);
      return true;
    },
    [routing]
  );

  return (
    <KeykitReactProvider
      config={keykit.config}
      initialLocale={keykit.locale}
      initialBundle={keykit.initialBundle ?? undefined}
      {...(routing ? { onSetLocale } : {})}
    >
      {children}
    </KeykitReactProvider>
  );
}

function persistLocaleCookie(locale: string): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.cookie =
    `keykit-locale=${encodeURIComponent(locale)}; ` +
    'Path=/; Max-Age=31536000; SameSite=Lax';
}
