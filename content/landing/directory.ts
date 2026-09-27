export type DirectoryItem = {
  slug: string;
  titleKey: string;
  title: string;
  descriptionKey: string;
  description: string;
};

export type DirectoryGroup = {
  id: 'guides' | 'compare';
  slug: 'guides' | 'compare';
  labelKey: string;
  label: string;
  titleKey: string;
  title: string;
  descriptionKey: string;
  description: string;
  items: DirectoryItem[];
};

export const marketingDirectories: DirectoryGroup[] = [
  {
    id: 'guides',
    slug: 'guides',
    labelKey: 'landing.nav.guides',
    label: 'Guides',
    titleKey: 'pages.guides.seo.metaTitle',
    title: 'Guides',
    descriptionKey: 'pages.guides.seo.metaDescription',
    description:
      'How Keykit discovers translation keys from your application and keeps the catalog in step with the code.',
    items: [
      {
        slug: 'how-it-works',
        titleKey: 'pages.howItWorks.hero.title',
        title: 'How Keykit works',
        descriptionKey: 'pages.howItWorks.seo.metaDescription',
        description:
          'Discover keys from your application, create missing translations, and track keys that are no longer used.',
      },
      {
        slug: 'translation-management',
        titleKey: 'pages.translationManagement.hero.title',
        title: 'Translation management',
        descriptionKey: 'pages.translationManagement.seo.metaDescription',
        description:
          'Manage application translations from the code outward, including live and static delivery.',
      },
      {
        slug: 'automatic-translation-key-discovery',
        titleKey: 'pages.automaticKeyDiscovery.hero.title',
        title: 'Automatic key discovery',
        descriptionKey: 'pages.automaticKeyDiscovery.seo.metaDescription',
        description:
          'Find translation keys in source and tag them for deprecation when they disappear.',
      },
      {
        slug: 'translation-key-lifecycle',
        titleKey: 'pages.translationKeyLifecycle.hero.title',
        title: 'Translation key lifecycle',
        descriptionKey: 'pages.translationKeyLifecycle.seo.metaDescription',
        description:
          'Why catalogs accumulate stale keys, and why deprecation is safer than automatic deletion.',
      },
      {
        slug: 'react-translations',
        titleKey: 'pages.reactTranslations.hero.title',
        title: 'React translations',
        descriptionKey: 'pages.reactTranslations.seo.metaDescription',
        description:
          'Manage React translations with source-discovered keys and live or static delivery.',
      },
      {
        slug: 'nextjs-translations',
        titleKey: 'pages.nextjsTranslations.hero.title',
        title: 'Next.js translations',
        descriptionKey: 'pages.nextjsTranslations.seo.metaDescription',
        description:
          'Use one translation workflow across Server Components, Client Components, and metadata.',
      },
    ],
  },
  {
    id: 'compare',
    slug: 'compare',
    labelKey: 'landing.nav.compare',
    label: 'Compare',
    titleKey: 'pages.compare.seo.metaTitle',
    title: 'Compare Keykit',
    descriptionKey: 'pages.compare.seo.metaDescription',
    description:
      'How Keykit’s source-driven translation workflow compares with broader localization platforms.',
    items: [
      {
        slug: 'keykit-vs-lokalise',
        titleKey: 'pages.keykitVsLokalise.hero.title',
        title: 'Keykit vs Lokalise',
        descriptionKey: 'pages.keykitVsLokalise.seo.metaDescription',
        description:
          'Source-driven key lifecycle compared with a broad localization management platform.',
      },
      {
        slug: 'keykit-vs-phrase',
        titleKey: 'pages.keykitVsPhrase.hero.title',
        title: 'Keykit vs Phrase',
        descriptionKey: 'pages.keykitVsPhrase.seo.metaDescription',
        description:
          'A focused developer workflow compared with Phrase Strings and its localization suite.',
      },
      {
        slug: 'keykit-vs-crowdin',
        titleKey: 'pages.keykitVsCrowdin.hero.title',
        title: 'Keykit vs Crowdin',
        descriptionKey: 'pages.keykitVsCrowdin.seo.metaDescription',
        description:
          'Automatic discovery and deprecation compared with continuous localization.',
      },
      {
        slug: 'keykit-vs-tolgee',
        titleKey: 'pages.keykitVsTolgee.hero.title',
        title: 'Keykit vs Tolgee',
        descriptionKey: 'pages.keykitVsTolgee.seo.metaDescription',
        description:
          'Source lifecycle compared with an SDK and in-context editing workflow.',
      },
    ],
  },
];
