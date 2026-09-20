'use client';

import { useRouter } from 'next/navigation';
import { KeykitProvider, type KeykitProviderProps } from './react';

export type KeykitNextClientProviderProps = Omit<
  KeykitProviderProps,
  'onServerRefresh'
>;

export function KeykitNextClientProvider(
  props: KeykitNextClientProviderProps
) {
  const router = useRouter();
  return (
    <KeykitProvider {...props} onServerRefresh={() => router.refresh()} />
  );
}
