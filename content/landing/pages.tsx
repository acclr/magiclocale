import type { ComponentType } from 'react';

import LandingHome from '@/components/defaultLanding/LandingHome';

import { landingSite } from './site';

const views: Record<string, ComponentType> = {
  home: LandingHome,
};

export function LandingView({ slug }: { slug: string }) {
  const page = landingSite.pages.find((item) => item.slug === slug);
  const View = page ? views[page.id] : undefined;
  if (!View) {
    return null;
  }
  return <View />;
}
