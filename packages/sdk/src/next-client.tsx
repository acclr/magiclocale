'use client';

import { useRouter } from 'next/navigation';
import { LocaleKitProvider, type LocaleKitProviderProps } from './react';

export type LocaleKitNextClientProviderProps = Omit<
  LocaleKitProviderProps,
  'onServerRefresh'
>;

export function LocaleKitNextClientProvider(
  props: LocaleKitNextClientProviderProps
) {
  const router = useRouter();
  return (
    <LocaleKitProvider {...props} onServerRefresh={() => router.refresh()} />
  );
}
