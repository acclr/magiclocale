import { useKeykit } from '@keykithq/sdk/react';

import MarketingPage, {
  SeoCards,
  SeoSection,
} from '@/components/defaultLanding/seo/MarketingPage';

const join = '/auth/join';

export function KeykitVsLokalisePage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) =>
    tr(`pages.keykitVsLokalise.${key}`, fallback);

  return (
    <MarketingPage
      slug="keykit-vs-lokalise"
      metaTitle={t('seo.metaTitle', 'Keykit vs Lokalise — Developer Translation Workflow Comparison')}
      metaDescription={t('seo.metaDescription', "Compare Keykit's source-driven translation-key lifecycle with Lokalise's broader localization management platform and developer automation ecosystem.")}
      eyebrow={t('hero.eyebrow', 'Keykit vs Lokalise')}
      title={t('hero.title', 'Two ways to automate software localization')}
      description={t('hero.description', 'Lokalise is a broad localization platform with repository integrations, APIs, CLI tooling, translation workflows and collaboration features. Keykit is narrower: it is built around discovering application translation keys from source code and managing their lifecycle automatically.')}
      primaryCta={{ label: t('hero.primaryCta', 'Try Keykit'), href: join }}
      secondaryCta={{ label: t('hero.secondaryCta', 'See how Keykit works'), href: '/how-it-works' }}
      finalCta={{
        title: t('finalCta.title', 'Prefer source-driven translation management?'),
        description: t('finalCta.description', 'Let your application tell the translation system which keys exist and when they stop being used.'),
        button: t('finalCta.button', 'Try Keykit'),
      }}
      faq={{
        title: t('faq.title', 'Keykit vs Lokalise FAQ'),
        items: [
          { question: t('faq.items.alternative.question', 'Is Keykit a Lokalise alternative?'), answer: t('faq.items.alternative.answer', 'For developer-led application translation management, yes. The products have different scopes: Lokalise is a broader localization platform, while Keykit focuses heavily on source-discovered application translation keys and their lifecycle.') },
          { question: t('faq.items.migrate.question', 'Can I migrate translations from Lokalise to Keykit?'), answer: t('faq.items.migrate.answer', 'The intended migration path is to bring existing translation data into Keykit first, preserve the current keys, then connect source discovery so Keykit can identify which imported keys are actively used.') },
          { question: t('faq.items.better.question', 'Which is better for a small React or Next.js team?'), answer: t('faq.items.better.answer', "If the team's main concern is keeping application translations synchronized with code and cleaning up stale keys automatically, Keykit's narrower workflow may be a better fit. Teams needing broader localization operations may prefer Lokalise.") },
        ],
      }}
    >
      <SeoSection title={t('summary.title', 'The short version')}>
        <SeoCards
          items={[
            { title: t('summary.keykit.title', 'Choose Keykit when'), description: t('summary.keykit.description', 'Your main problem is keeping application translation keys synchronized with React, Next.js or other product code without maintaining a separate key inventory and cleanup process.') },
            { title: t('summary.competitor.title', 'Choose Lokalise when'), description: t('summary.competitor.description', 'You need a broad localization-management environment with mature translation workflows, repository integrations, collaboration tooling and a larger localization operation.') },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('philosophy.title', 'The biggest difference is where translation state starts')}>
        <p>{t('philosophy.description', "Both products aim to automate localization. Keykit's core model begins with translation usage in the application itself.")}</p>
        <p>{t('philosophy.note', "Lokalise provides substantial automation around repository and localization workflows. Keykit's distinction is that source-key discovery and key deprecation are the center of the product model rather than an external synchronization concern.")}</p>
      </SeoSection>
      <SeoSection title={t('fit.keykit.title', 'Keykit is likely the better fit when')}>
        <SeoCards
          items={[
            { title: t('fit.keykit.items.engineering', 'Engineering owns localization'), description: t('fit.keykit.items.react', 'React or Next.js is central to the product stack.') },
            { title: t('fit.keykit.items.sync', 'You want less sync work'), description: t('fit.keykit.items.cleanup', 'Stale keys and cleanup are a recurring technical-debt problem.') },
          ]}
        />
      </SeoSection>
    </MarketingPage>
  );
}

export function KeykitVsPhrasePage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) => tr(`pages.keykitVsPhrase.${key}`, fallback);

  return (
    <MarketingPage
      slug="keykit-vs-phrase"
      metaTitle={t('seo.metaTitle', 'Keykit vs Phrase Strings — Developer Localization Comparison')}
      metaDescription={t('seo.metaDescription', "Compare Keykit's source-driven translation-key lifecycle with Phrase Strings and its broader localization-management workflow.")}
      eyebrow={t('hero.eyebrow', 'Keykit vs Phrase')}
      title={t('hero.title', 'A focused developer translation tool vs a broader localization platform')}
      description={t('hero.description', 'Phrase Strings supports structured translation projects, localization files, CLI/API workflows, integrations and enterprise localization processes. Keykit focuses on making application translation keys originate from and stay connected to the code using them.')}
      primaryCta={{ label: t('hero.primaryCta', 'Try Keykit'), href: join }}
      finalCta={{
        title: t('finalCta.title', 'Keep the translation catalog closer to the application'),
        description: t('finalCta.description', 'Use source discovery instead of maintaining translation inventory as a separate engineering concern.'),
        button: t('finalCta.button', 'Try Keykit'),
      }}
      faq={{
        title: t('faq.title', 'Keykit vs Phrase FAQ'),
        items: [
          { question: t('faq.items.alternative.question', 'Is Keykit a Phrase Strings alternative?'), answer: t('faq.items.alternative.answer', 'Keykit can be an alternative for teams primarily managing translations for their own applications. Phrase has a broader localization scope, while Keykit is intentionally centered on developer source usage and translation-key lifecycle.') },
          { question: t('faq.items.cleanup.question', 'What is the main Keykit difference?'), answer: t('faq.items.cleanup.answer', 'Keykit is designed to discover when a key appears in application source and when it later disappears, turning those changes into translation lifecycle state automatically.') },
        ],
      }}
    >
      <SeoSection title={t('summary.title', 'The practical difference')}>
        <p>{t('summary.description', "Phrase is designed to cover a wide localization-management surface. Keykit deliberately focuses on a smaller engineering problem: discovering translation keys from application source, translating them and tracking their lifecycle as the code changes.")}</p>
      </SeoSection>
      <SeoSection title={t('model.title', 'Keykit treats source usage as first-class translation state')}>
        <p>{t('model.description', 'Localization files and projects are useful representations of translation data. Keykit adds another piece of information that matters to engineers: where the key is actually being used now.')}</p>
        <p>{t('model.result', 'Keykit can discover application keys from source. If a feature is later redesigned away, the old identifiers can become deprecation candidates automatically.')}</p>
      </SeoSection>
      <SeoSection title={t('fit.keykit.title', 'Consider Keykit when')}>
        <SeoCards
          items={[
            { title: t('fit.keykit.items.developers', 'Engineering owns setup'), description: t('fit.keykit.items.source', 'You want translation inventory to follow actual source usage.') },
            { title: t('fit.keykit.items.cleanup', 'Removed features should create stale-key signals'), description: t('fit.keykit.items.scope', 'You do not need the breadth of a large enterprise localization suite.') },
          ]}
        />
      </SeoSection>
    </MarketingPage>
  );
}

export function KeykitVsCrowdinPage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) => tr(`pages.keykitVsCrowdin.${key}`, fallback);

  return (
    <MarketingPage
      slug="keykit-vs-crowdin"
      metaTitle={t('seo.metaTitle', 'Keykit vs Crowdin — Developer Localization Comparison')}
      metaDescription={t('seo.metaDescription', "Compare Keykit's automatic translation-key discovery and deprecation workflow with Crowdin's broad continuous-localization platform.")}
      eyebrow={t('hero.eyebrow', 'Keykit vs Crowdin')}
      title={t('hero.title', 'Source-level key lifecycle vs broad continuous localization')}
      description={t('hero.description', "Crowdin offers a large localization platform with Git integrations, many supported formats, translation workflows, AI tooling and a broad integration ecosystem. Keykit is intentionally narrower and centers translation state around source-code usage.")}
      primaryCta={{ label: t('hero.primaryCta', 'Try Keykit'), href: join }}
      finalCta={{
        title: t('finalCta.title', 'Want the translation inventory to come from the application itself?'),
        description: t('finalCta.description', 'Discover active keys directly from source and surface stale ones automatically.'),
        button: t('finalCta.button', 'Try Keykit'),
      }}
      faq={{
        title: t('faq.title', 'Keykit vs Crowdin FAQ'),
        items: [
          { question: t('faq.items.alternative.question', 'Is Keykit a Crowdin alternative?'), answer: t('faq.items.alternative.answer', 'For teams focused on application translation management, it can be. Crowdin covers a much broader localization surface, while Keykit focuses heavily on source-driven application keys and their lifecycle.') },
          { question: t('faq.items.migration.question', 'Can I move existing Crowdin translations to Keykit?'), answer: t('faq.items.migration.answer', 'The intended workflow is to import or map the existing translation data, then connect source discovery so Keykit can distinguish actively detected keys from legacy catalog entries.') },
          { question: t('faq.items.react.question', 'Which is better for React?'), answer: t('faq.items.react.answer', 'That depends on requirements. Keykit is specifically designed around a minimal developer workflow and source-level key lifecycle. Crowdin offers broader localization infrastructure and integrations.') },
        ],
      }}
    >
      <SeoSection title={t('shared.title', 'Both products want localization to move with development')}>
        <p>{t('shared.description', 'Crowdin provides continuous localization through repository, CLI, API and integration workflows. Keykit approaches the same developer pain from a different direction: the translation calls inside the application define which keys are active.')}</p>
      </SeoSection>
      <SeoSection title={t('workflow.title', 'Resource synchronization or direct key discovery')}>
        <p>{t('workflow.description', "Many continuous-localization setups synchronize translation resources between the repository and localization platform. Keykit's core workflow can discover static keys directly from the application source.")}</p>
        <p>{t('workflow.note', 'Crowdin supports substantial automation around its workflow. The comparison is about architecture and product emphasis, not whether Crowdin can automate localization.')}</p>
      </SeoSection>
      <SeoSection title={t('cleanup.title', 'Keykit makes disappearance from source a translation event')}>
        <p>{t('cleanup.description', 'When a feature is removed, Keykit can recognize that its translation key is no longer detected and mark it for deprecation.')}</p>
      </SeoSection>
    </MarketingPage>
  );
}

export function KeykitVsTolgeePage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) => tr(`pages.keykitVsTolgee.${key}`, fallback);

  return (
    <MarketingPage
      slug="keykit-vs-tolgee"
      metaTitle={t('seo.metaTitle', 'Keykit vs Tolgee — Developer-First Localization Compared')}
      metaDescription={t('seo.metaDescription', "Compare two developer-first localization approaches: Tolgee's SDK and in-context editing workflow vs Keykit's automatic source discovery and translation-key lifecycle.")}
      eyebrow={t('hero.eyebrow', 'Keykit vs Tolgee')}
      title={t('hero.title', 'Two developer-first approaches to application localization')}
      description={t('hero.description', "Tolgee and Keykit both aim to make localization less painful for software teams. The difference is emphasis: Tolgee has a strong SDK and in-context editing model, while Keykit centers its workflow on automatic source discovery and translation-key lifecycle.")}
      primaryCta={{ label: t('hero.primaryCta', 'Try Keykit'), href: join }}
      finalCta={{
        title: t('finalCta.title', 'If stale keys are the problem, start from source usage'),
        description: t('finalCta.description', 'Let Keykit discover when translation keys appear and when they stop being part of the application.'),
        button: t('finalCta.button', 'Try Keykit'),
      }}
      faq={{
        title: t('faq.title', 'Keykit vs Tolgee FAQ'),
        items: [
          { question: t('faq.items.alternative.question', 'Is Keykit a Tolgee alternative?'), answer: t('faq.items.alternative.answer', 'Yes for teams evaluating developer-focused application localization, but the products emphasize different workflows.') },
          { question: t('faq.items.mainDifference.question', 'What is the biggest difference?'), answer: t('faq.items.mainDifference.answer', 'Tolgee strongly emphasizes runtime SDK integration and in-context translation. Keykit strongly emphasizes automatic source-key discovery, lifecycle state and deprecation when source usage disappears.') },
          { question: t('faq.items.selfHosted.question', 'Can Keykit be self-hosted?'), answer: t('faq.items.selfHosted.answer', 'Keykit is offered as a hosted service. Tolgee is a stronger fit if an open-source or self-hosted localization stack is a requirement.') },
        ],
      }}
    >
      <SeoSection title={t('similarity.title', 'This is not an old-school TMS vs developer tooling comparison')}>
        <p>{t('similarity.description', 'Tolgee is already built for developers. Its SDK can provide runtime i18n functionality and connect applications to the Tolgee platform, while its in-context tooling lets users edit translations directly from the application.')}</p>
      </SeoSection>
      <SeoSection title={t('difference.title', 'Keykit focuses on the lifecycle of the identifier itself')}>
        <p>{t('difference.description', 'Keykit’s central question is not only what a key translates to. It is also where the key is still being used, and what should happen when it disappears.')}</p>
      </SeoSection>
      <SeoSection title={t('context.title', 'In-context editing and source lifecycle solve different problems')}>
        <SeoCards
          items={[
            { title: t('context.tolgee.title', "Tolgee's in-context question"), description: t('context.tolgee.description', 'Where in the interface is this text, and how can someone edit the translation directly from the application?') },
            { title: t('context.keykit.title', "Keykit's lifecycle question"), description: t('context.keykit.description', 'Which source still references this translation key, and is it becoming safe to deprecate or remove?') },
          ]}
        />
        <p>{t('context.conclusion', 'A team may care much more about one of these workflows depending on who owns localization and where the current pain is.')}</p>
      </SeoSection>
      <SeoSection title={t('tradeoff.title', 'Choose around the workflow you actually want')}>
        <p>{t('tradeoff.description', "Keykit should not try to win this comparison by pretending every localization feature is equivalent. Tolgee has meaningful strengths in open-source and self-hosted localization and in-context editing. Keykit's reason to exist is a different one: make translation-key state follow source-code state automatically.")}</p>
      </SeoSection>
    </MarketingPage>
  );
}
