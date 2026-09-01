'use client';

import { useRouter } from 'next/navigation';
import { MagiLocaleProvider, type MagiLocaleProviderProps } from './react';

export type MagiLocaleNextClientProviderProps = Omit<
  MagiLocaleProviderProps,
  'onServerRefresh'
>;

export function MagiLocaleNextClientProvider(
  props: MagiLocaleNextClientProviderProps
) {
  const router = useRouter();
  return (
    <MagiLocaleProvider {...props} onServerRefresh={() => router.refresh()} />
  );
}
