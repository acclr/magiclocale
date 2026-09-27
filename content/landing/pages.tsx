import type { ComponentType } from 'react';

import LandingHome from '@/components/defaultLanding/LandingHome';
import {
  CompareIndexPage,
  GuidesIndexPage,
} from '@/components/defaultLanding/ResourceIndex';

import {
  KeykitVsCrowdinPage,
  KeykitVsLokalisePage,
  KeykitVsPhrasePage,
  KeykitVsTolgeePage,
} from './seo-comparison-pages';
import {
  AutomaticKeyDiscoveryPage,
  HowItWorksPage,
  NextjsTranslationsPage,
  ReactTranslationsPage,
  TranslationKeyLifecyclePage,
  TranslationManagementPage,
} from './seo-product-pages';
import { landingSite } from './site';

const views: Record<string, ComponentType> = {
  home: LandingHome,
  guides: GuidesIndexPage,
  compare: CompareIndexPage,
  'how-it-works': HowItWorksPage,
  'automatic-key-discovery': AutomaticKeyDiscoveryPage,
  'translation-key-lifecycle': TranslationKeyLifecyclePage,
  'react-translations': ReactTranslationsPage,
  'nextjs-translations': NextjsTranslationsPage,
  'translation-management': TranslationManagementPage,
  'keykit-vs-lokalise': KeykitVsLokalisePage,
  'keykit-vs-phrase': KeykitVsPhrasePage,
  'keykit-vs-crowdin': KeykitVsCrowdinPage,
  'keykit-vs-tolgee': KeykitVsTolgeePage,
};

export function LandingView({ slug }: { slug: string }) {
  const page = landingSite.pages.find((item) => item.slug === slug);
  const View = page ? views[page.id] : undefined;
  if (!View) {
    return null;
  }
  return <View />;
}
