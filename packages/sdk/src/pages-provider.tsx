'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import Router from 'next/router';

import { hrefForLocale, matchLocalePath } from './locale-path';
import type { KeykitPageProps } from './pages-request';
import { KeykitProvider as KeykitReactProvider, useKeykit } from './react';

export function KeykitProvider({
  keykit,
  children,
}: {
  keykit: KeykitPageProps;
  children: ReactNode;
}) {
  const routing = keykit.routing;

  return (
    <KeykitReactProvider
      config={keykit.config}
      initialLocale={keykit.locale}
      initialBundle={keykit.initialBundle ?? undefined}
    >
      {routing ? <LocalePathSync routing={routing} /> : <DocumentLang />}
      {children}
    </KeykitReactProvider>
  );
}

function DocumentLang() {
  const { locale } = useKeykit();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

/**
 * Keeps `/sv` in the address bar without loading the document again. The
 * bundle is fetched in memory, then the URL changes with a shallow transition.
 */
function LocalePathSync({
  routing,
}: {
  routing: NonNullable<KeykitPageProps['routing']>;
}) {
  const { locale, setLocale } = useKeykit();
  const skipInitialUrlSync = useRef(true);

  useEffect(() => {
    document.documentElement.lang = locale;
    if (skipInitialUrlSync.current) {
      skipInitialUrlSync.current = false;
      return;
    }
    const href = hrefForLocale(window.location.pathname, locale, routing);
    if (href === window.location.pathname) {
      return;
    }
    const url = `${href}${window.location.search}${window.location.hash}`;
    void Router.push(url, undefined, {
      shallow: true,
      scroll: false,
      locale: false,
    }).catch(() => {
      window.history.pushState(null, '', url);
    });
  }, [locale, routing]);

  useEffect(() => {
    const onPopState = () => {
      const matched = matchLocalePath(window.location.pathname, routing);
      if (!matched || matched.locale === locale) {
        return;
      }
      void setLocale(matched.locale);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [locale, routing, setLocale]);

  return null;
}
