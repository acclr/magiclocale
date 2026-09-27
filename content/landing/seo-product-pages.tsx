import { useKeykit } from '@keykithq/sdk/react';

import MarketingPage, {
  CodeBlock,
  SeoCards,
  SeoSection,
  marketingPath,
} from '@/components/defaultLanding/seo/MarketingPage';

const join = '/auth/join';

const sdkExample = `import { useKeykit } from '@keykithq/sdk/react';

export function EmptyState() {
  const { translate } = useKeykit();

  return (
    <section>
      <h2>{translate('projects.empty.title', 'No projects yet')}</h2>
      <p>{translate('projects.empty.description', 'Create a project to get started.')}</p>
    </section>
  );
}`;

export function HowItWorksPage() {
  const { translate: tr, locale } = useKeykit();
  const t = (key: string, fallback: string) =>
    tr(`pages.howItWorks.${key}`, fallback);
  const href = (slug: string) => marketingPath(locale, slug);

  return (
    <MarketingPage
      slug="how-it-works"
      metaTitle={t(
        'seo.metaTitle',
        'How Keykit Works — Translation Management From Your Code'
      )}
      metaDescription={t(
        'seo.metaDescription',
        'Keykit discovers translation keys from your application, creates missing translations and tracks when keys are no longer used—without making you maintain a separate translation-key inventory.'
      )}
      eyebrow={t('hero.eyebrow', 'How Keykit works')}
      title={t(
        'hero.title',
        'Your application already knows what needs translating'
      )}
      description={t(
        'hero.description',
        'Keykit connects your translation catalog directly to the code using it. Add a normal translation call, let Keykit discover the key, and manage the entire translation lifecycle without keeping a second inventory in sync by hand.'
      )}
      primaryCta={{ label: t('hero.primaryCta', 'Start with Keykit'), href: join }}
      secondaryCta={{
        label: t('hero.secondaryCta', 'See automatic key discovery'),
        href: href('automatic-translation-key-discovery'),
      }}
      finalCta={{
        title: t('finalCta.title', 'Let the code drive the translation catalog'),
        description: t(
          'finalCta.description',
          'Create translations when features appear, identify stale keys when features disappear, and stop maintaining translation state twice.'
        ),
        button: t('finalCta.button', 'Start with Keykit'),
      }}
      faq={{
        title: t('faq.title', 'How Keykit works'),
        items: [
          {
            question: t('faq.items.replaceLibrary.question', 'Does Keykit replace my i18n library?'),
            answer: t(
              'faq.items.replaceLibrary.answer',
              'Keykit manages the translation workflow, key lifecycle and delivery around your application. Runtime concerns such as formatting, interpolation, pluralization and locale routing still depend on the integration and framework you use.'
            ),
          },
          {
            question: t('faq.items.discovery.question', 'How does Keykit discover translation keys?'),
            answer: t(
              'faq.items.discovery.answer',
              'Keykit analyzes supported translation calls in connected source code and records statically identifiable keys used by the application.'
            ),
          },
          {
            question: t('faq.items.deleted.question', 'Does Keykit immediately delete a key when it disappears?'),
            answer: t(
              'faq.items.deleted.answer',
              'No. Disappearance from source is a signal, not proof that deletion is safe. Keykit can mark the key as no longer detected or deprecated so it can be reviewed first.'
            ),
          },
          {
            question: t('faq.items.existing.question', 'Can I use Keykit with an existing application?'),
            answer: t(
              'faq.items.existing.answer',
              'Yes. Existing translations can be brought into the project first, then Keykit can use source discovery to help show which keys are actively detected by the connected application.'
            ),
          },
          {
            question: t('faq.items.delivery.question', 'Do translations have to be fetched at runtime?'),
            answer: t(
              'faq.items.delivery.answer',
              'No. Keykit supports both live delivery and a static workflow where the CLI pulls translation resources into the application.'
            ),
          },
        ],
      }}
    >
      <SeoSection
        eyebrow={t('discovery.eyebrow', 'Source-driven localization')}
        title={t('discovery.title', 'One translation call is enough to introduce a key')}
      >
        <p>
          {t(
            'discovery.description',
            'With a traditional workflow, developers often have to think about both the code and the translation system. Keykit treats usage in the application as the important signal. When a new static translation key appears in your source, Keykit can discover it and bring it into the project automatically.'
          )}
        </p>
        <CodeBlock
          code={`import { useKeykit } from '@keykithq/sdk/react';

function CreateProjectButton() {
  const { translate } = useKeykit();
  return <Button>{translate('projects.actions.create', 'Create')}</Button>;
}`}
        />
        <p>
          {t(
            'discovery.exampleCaption',
            'Keykit sees the key used by the application and adds it to the translation workflow. There is no separate step to register the key in a dashboard first.'
          )}
        </p>
      </SeoSection>
      <SeoSection title={t('workflow.title', 'From source code to every supported language')}>
        <p>
          {t(
            'workflow.description',
            'Keykit keeps the translation workflow centered around the product code instead of forcing developers to maintain synchronization plumbing around it.'
          )}
        </p>
        <SeoCards
          items={[
            {
              title: t('workflow.steps.write.title', '1. Use the key'),
              description: t(
                'workflow.steps.write.description',
                'Write a normal translation call where the text belongs. Use a stable, statically analyzable key that describes the product concept.'
              ),
            },
            {
              title: t('workflow.steps.discover.title', '2. Keykit discovers it'),
              description: t(
                'workflow.steps.discover.description',
                'Keykit scans the connected source and recognizes new translation keys used by the application.'
              ),
            },
            {
              title: t('workflow.steps.translate.title', '3. Missing translations are created'),
              description: t(
                'workflow.steps.translate.description',
                'New locale values can be generated automatically, reviewed and edited from the Keykit project.'
              ),
            },
            {
              title: t('workflow.steps.deliver.title', '4. Your application gets the translations'),
              description: t(
                'workflow.steps.deliver.description',
                "Use Keykit's live or static delivery model depending on how you want translations to reach the application."
              ),
            },
          ]}
        />
      </SeoSection>
      <SeoSection
        eyebrow={t('delivery.eyebrow', 'Choose your delivery model')}
        title={t('delivery.title', 'Fetch translations live or keep them as static application resources')}
      >
        <p>
          {t(
            'delivery.description',
            'Keykit supports two delivery models so teams can choose between runtime freshness and build-time control. Set delivery: "live" or delivery: "static" in the project config.'
          )}
        </p>
        <SeoCards
          items={[
            {
              title: t('delivery.live.title', 'Live delivery'),
              description: `${t('delivery.live.description', 'Load translations from Keykit at runtime so updated copy can become available without maintaining generated locale files manually.')} ${t('delivery.live.highlight', 'Useful when you want translation changes to move independently from application builds.')}`,
            },
            {
              title: t('delivery.static.title', 'Static delivery'),
              description: `${t('delivery.static.description', 'Keep translations as static resources inside your application and use the Keykit CLI pull workflow to populate them.')} ${t('delivery.static.highlight', 'Useful when translations should be versioned, bundled and deployed with the application.')}`,
            },
          ]}
        />
        <CodeBlock code={'npx @keykithq/cli pull'} />
      </SeoSection>
      <SeoSection
        eyebrow={t('deprecation.eyebrow', 'Automatic lifecycle tracking')}
        title={t('deprecation.title', 'Removing UI should also clean up its translation debt')}
      >
        <p>
          {t(
            'deprecation.description',
            'Translation systems are good at accumulating keys and much worse at telling you when those keys stopped mattering. Keykit treats disappearance from source as useful information.'
          )}
        </p>
        <h3 className="text-foreground">{t('deprecation.resultTitle', 'Keykit no longer detects the key')}</h3>
        <p>
          {t(
            'deprecation.resultDescription',
            'Instead of immediately deleting the translation, Keykit can mark it as no longer detected or deprecated so the team can review it safely.'
          )}
        </p>
      </SeoSection>
      <SeoSection title={t('safeRemoval.title', 'Unused does not always mean safe to delete')}>
        <p>
          {t(
            'safeRemoval.description',
            'A key may disappear from one frontend while another application, backend service or older deployed version still depends on it. That is why Keykit separates detection from deletion.'
          )}
        </p>
        <SeoCards
          items={[
            {
              title: t('safeRemoval.items.otherSource.title', 'Another source may still use it'),
              description: t(
                'safeRemoval.items.otherSource.description',
                'A web app can stop using a key while an admin application or backend service still references it.'
              ),
            },
            {
              title: t('safeRemoval.items.rollback.title', 'A rollback may still need it'),
              description: t(
                'safeRemoval.items.rollback.description',
                'Immediate deletion turns a normal refactor into a potentially breaking operation for older deployed code.'
              ),
            },
            {
              title: t('safeRemoval.items.review.title', 'Developers keep the final decision'),
              description: t(
                'safeRemoval.items.review.description',
                'Keykit records that a key disappeared and surfaces it for review instead of pretending absence always means deletion is safe.'
              ),
            },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('lifecycle.title', 'Translation keys have a lifecycle')}>
        <p>
          {t(
            'lifecycle.description',
            'Treating keys as long-lived entities makes localization easier to understand and much safer to clean up.'
          )}
        </p>
        <SeoCards
          items={[
            ['discovered', 'Discovered', 'The key has appeared in a connected source.'],
            ['active', 'Active', 'The key is currently detected and belongs to the live translation catalog.'],
            ['translated', 'Translated', 'Required locales have values available.'],
            ['notDetected', 'No longer detected', 'A source that previously referenced the key no longer does.'],
            ['deprecated', 'Deprecated', 'The key has become a cleanup candidate and should be reviewed.'],
            ['removed', 'Removed', 'The team has confirmed the key is no longer needed.'],
          ].map(([id, title, description]) => ({
            title: t(`lifecycle.states.${id}.title`, title),
            description: t(`lifecycle.states.${id}.description`, description),
          }))}
        />
      </SeoSection>
      <SeoSection title={t('why.title', 'You should not need a second engineering system just to synchronize strings')}>
        <p>
          {t(
            'why.description',
            'Localization often grows into a collection of extraction scripts, generated files, upload jobs, download jobs, repository integrations and cleanup conventions. Keykit is built around a simpler idea: let source usage drive translation state.'
          )}
        </p>
        <p>{t('why.note', 'The exact runtime path depends on whether your project uses live or static delivery.')}</p>
      </SeoSection>
    </MarketingPage>
  );
}

export function AutomaticKeyDiscoveryPage() {
  const { translate: tr, locale } = useKeykit();
  const t = (key: string, fallback: string) =>
    tr(`pages.automaticKeyDiscovery.${key}`, fallback);
  const href = (slug: string) => marketingPath(locale, slug);

  return (
    <MarketingPage
      slug="automatic-translation-key-discovery"
      metaTitle={t(
        'seo.metaTitle',
        'Automatic Translation Key Discovery for React and Next.js | Keykit'
      )}
      metaDescription={t(
        'seo.metaDescription',
        'Discover translation keys directly from your application code, identify new strings automatically and tag keys for deprecation when they disappear.'
      )}
      eyebrow={t('hero.eyebrow', 'Automatic key discovery')}
      title={t('hero.title', 'Stop registering translation keys twice')}
      description={t(
        'hero.description',
        'Your code already contains the information needed to know which translation keys exist. Keykit uses that source information to keep the translation catalog aligned with the application.'
      )}
      primaryCta={{ label: t('hero.primaryCta', 'Try automatic key discovery'), href: join }}
      secondaryCta={{ label: t('hero.secondaryCta', 'See how Keykit works'), href: href('how-it-works') }}
      finalCta={{
        title: t('finalCta.title', 'Make translation state follow application state'),
        description: t(
          'finalCta.description',
          'Discover new keys when developers add them and surface old keys when the code stops using them.'
        ),
        button: t('finalCta.button', 'Start discovering keys'),
      }}
      faq={{
        title: t('faq.title', 'Automatic translation-key discovery FAQ'),
        items: [
          {
            question: t('faq.items.what.question', 'What is translation-key discovery?'),
            answer: t(
              'faq.items.what.answer',
              'Translation-key discovery is the process of identifying translation identifiers directly from the code that uses them rather than relying only on a separately maintained translation catalog.'
            ),
          },
          {
            question: t('faq.items.dynamic.question', 'Can Keykit discover dynamically generated translation keys?'),
            answer: t(
              'faq.items.dynamic.answer',
              'Static string keys are the most reliable input for source analysis. Dynamically generated identifiers may require explicit handling because the complete key cannot always be determined from source code.'
            ),
          },
          {
            question: t('faq.items.removed.question', 'What happens when a discovered key is removed from the code?'),
            answer: t(
              'faq.items.removed.answer',
              'Keykit can record that the key is no longer detected and move it into a deprecation workflow instead of immediately deleting it.'
            ),
          },
          {
            question: t('faq.items.multiple.question', 'Can more than one application contribute key usage?'),
            answer: t(
              'faq.items.multiple.answer',
              'Keykit is designed around source-aware translation management, so source identity can be used to distinguish where a key is still being detected.'
            ),
          },
        ],
      }}
    >
      <SeoSection title={t('problem.title', 'Translation catalogs drift when code and translation state are maintained separately')}>
        <p>
          {t(
            'problem.description',
            'Every manual synchronization boundary creates another place for application state and translation state to disagree.'
          )}
        </p>
        <SeoCards
          items={[
            {
              title: t('problem.items.missing.title', 'A key exists in code but not in the catalog'),
              description: t('problem.items.missing.description', 'The feature ships before every locale knows the string exists.'),
            },
            {
              title: t('problem.items.stale.title', 'A key exists in the catalog but not in code'),
              description: t('problem.items.stale.description', 'Nobody knows whether it is stale, intentionally retained or still used somewhere else.'),
            },
            {
              title: t('problem.items.rename.title', 'A key is renamed'),
              description: t('problem.items.rename.description', 'The new key appears while the old one quietly survives for years.'),
            },
            {
              title: t('problem.items.multiSource.title', 'Different repositories synchronize differently'),
              description: t('problem.items.multiSource.description', 'The central catalog stops representing the applications that actually consume it.'),
            },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('workflow.title', 'Use the translation. Keykit finds the key.')}>
        <p>
          {t(
            'workflow.description',
            'The ideal developer workflow should be no more complicated than writing the translation where it is needed.'
          )}
        </p>
        <CodeBlock code={`translate('billing.subscription.cancel', 'Cancel subscription')`} />
        <p>
          {t(
            'workflow.resultDescription',
            'Keykit can register the key, identify missing languages and keep its source-usage state connected to the application.'
          )}
        </p>
      </SeoSection>
      <SeoSection title={t('staticKeys.title', 'Predictable keys make automation reliable')}>
        <p>
          {t(
            'staticKeys.description',
            'Static translation identifiers are easier to discover, search, refactor and deprecate safely.'
          )}
        </p>
        <p>
          {t(
            'staticKeys.recommendation',
            'Prefer explicit translation keys whenever practical. Dynamic key generation can make it impossible for static analysis to know the complete set of possible translations.'
          )}
        </p>
        <CodeBlock
          code={`translate('documents.upload.success', 'Uploaded')\n// less analyzable:\ntranslate(\`documents.\${type}.\${state}\`)`}
        />
      </SeoSection>
      <SeoSection title={t('twoWay.title', 'The important event is not only when a key appears')}>
        <p>
          {t(
            'twoWay.description',
            'A useful translation system should also notice when a key that used to exist has disappeared. A new key is created and translated. A missing key is marked no longer detected, then reviewed, and removed only when that is safe.'
          )}
        </p>
      </SeoSection>
      <SeoSection title={t('sources.title', 'One catalog can have several consumers')}>
        <p>
          {t(
            'sources.description',
            'Applications often share translation infrastructure across more than one codebase. Keykit makes usage information explicit instead of treating the catalog as an isolated list of strings.'
          )}
        </p>
        <p>
          {t(
            'sources.note',
            'A key that disappears from one source should not automatically be treated as globally unused while another connected source still depends on it.'
          )}
        </p>
      </SeoSection>
      <SeoSection title={t('refactor.title', 'Translation cleanup can happen naturally during refactoring')}>
        <p>
          {t(
            'refactor.description',
            'When developers rename or remove UI, the translation catalog should be able to follow instead of accumulating every historical version forever. The new key is detected. The old key becomes a deprecation candidate.'
          )}
        </p>
      </SeoSection>
    </MarketingPage>
  );
}

export function TranslationKeyLifecyclePage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) =>
    tr(`pages.translationKeyLifecycle.${key}`, fallback);

  return (
    <MarketingPage
      slug="translation-key-lifecycle"
      metaTitle={t('seo.metaTitle', 'Unused Translation Keys: Discovery, Deprecation and Cleanup')}
      metaDescription={t(
        'seo.metaDescription',
        'Why translation catalogs accumulate stale i18n keys, why automatic deletion is risky and how source-driven deprecation makes cleanup safer.'
      )}
      eyebrow={t('hero.eyebrow', 'Translation architecture')}
      title={t('hero.title', 'Translation keys are easy to add—and surprisingly hard to remove')}
      description={t(
        'hero.description',
        'Every feature creates new strings. Every refactor removes some of them. Most translation systems are good at the first half of that lifecycle and leave teams guessing about the second.'
      )}
      primaryCta={{ label: t('finalCta.button', 'See automatic key discovery'), href: '/automatic-translation-key-discovery' }}
      finalCta={{
        title: t('finalCta.title', 'Let refactoring clean up localization debt too'),
        description: t('finalCta.description', 'Keykit turns source changes into translation lifecycle changes automatically.'),
        button: t('finalCta.button', 'See automatic key discovery'),
        href: '/automatic-translation-key-discovery',
      }}
      faq={{
        title: t('faq.title', 'Translation-key cleanup FAQ'),
        items: [
          {
            question: t('faq.items.find.question', 'How do I find unused translation keys?'),
            answer: t('faq.items.find.answer', 'The safest approach is to compare translation entries with usage across every relevant source rather than searching only one codebase.'),
          },
          {
            question: t('faq.items.autoDelete.question', 'Is it safe to automatically delete unused i18n keys?'),
            answer: t('faq.items.autoDelete.answer', 'Usually not immediately. A key can be absent from one source while still being needed elsewhere. Automatically marking it as no longer detected or deprecated is safer than permanent deletion.'),
          },
          {
            question: t('faq.items.rename.question', 'What should happen when I rename a translation key?'),
            answer: t('faq.items.rename.answer', 'The new key should become active while the previous key becomes a deprecation candidate once it is no longer detected.'),
          },
          {
            question: t('faq.items.backend.question', 'What if a backend system also uses the translations?'),
            answer: t('faq.items.backend.answer', 'Track the backend as another relevant source when possible. A key should not be considered globally unused merely because the frontend stopped using it.'),
          },
        ],
      }}
    >
      <SeoSection>
        <p>{t('intro.p1', 'A developer adds a translation key while building a feature. The application grows, the feature changes and years later nobody remembers which system introduced the key or whether it is still safe to remove.')}</p>
        <p>{t('intro.p2', 'That uncertainty has a predictable result: teams keep old translation keys forever.')}</p>
        <p>{t('intro.p3', 'Do that hundreds or thousands of times and the translation catalog becomes another form of technical debt.')}</p>
      </SeoSection>
      <SeoSection title={t('growth.title', 'Translation catalogs naturally grow in one direction')}>
        <p>{t('growth.p1', 'Adding a key is low risk. Deleting one can break an interface, email, backend message or older deployed client.')}</p>
        <p>{t('growth.p2', 'So teams behave rationally: they add aggressively and delete cautiously.')}</p>
        <p>{t('growth.p3', 'The result is a catalog containing active product copy, historical copy, renamed keys, abandoned experiments and strings that nobody can confidently classify.')}</p>
      </SeoSection>
      <SeoSection title={t('unused.title', '“Unused” is a system-level question, not always a repository-level question')}>
        <p>{t('unused.p1', 'Searching one frontend repository can tell you that a key is not used by that frontend. It cannot automatically prove that nothing else depends on it.')}</p>
        <p>{t('unused.p2', 'The same translation project may feed a web application, an admin application, backend messages, email templates and background workers.')}</p>
      </SeoSection>
      <SeoSection title={t('sync.title', 'The problem gets worse when every system synchronizes translations differently')}>
        <p>{t('sync.p1', 'A mature product can end up with translation resources moving through repositories, CI jobs, backend resource files, generated JSON and external translation tooling.')}</p>
        <p>{t('sync.p2', 'Every synchronization step becomes another script, token, convention and failure mode that the team has to maintain.')}</p>
        <p>{t('sync.callout', 'The harder the synchronization system is to understand, the less likely anyone is to trust automated cleanup.')}</p>
      </SeoSection>
      <SeoSection title={t('transition.title', 'Deletion should be a state transition, not a guess')}>
        <p>{t('transition.description', 'A safer model separates the objective fact that a key disappeared from the decision to permanently remove it: active, no longer detected, deprecated, reviewed, then removed.')}</p>
        <SeoCards
          items={[
            { title: t('transition.states.active.title', 'Active'), description: t('transition.states.active.description', 'At least one relevant source currently references the key.') },
            { title: t('transition.states.notDetected.title', 'No longer detected'), description: t('transition.states.notDetected.description', 'A source that previously referenced the key no longer does.') },
            { title: t('transition.states.deprecated.title', 'Deprecated'), description: t('transition.states.deprecated.description', 'The key is now a cleanup candidate rather than part of normal active development.') },
            { title: t('transition.states.reviewed.title', 'Reviewed'), description: t('transition.states.reviewed.description', 'The team has checked whether another source, deployment or compatibility requirement still needs it.') },
            { title: t('transition.states.removed.title', 'Removed'), description: t('transition.states.removed.description', 'The translation entry can now be deleted intentionally.') },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('deprecation.title', 'Automatic deprecation is more trustworthy than automatic deletion')}>
        <p>{t('deprecation.p1', 'Keykit does not need to guess that a translation is invalid. It only needs to record an observable fact: this connected source used to contain the key, and now it does not.')}</p>
        <p>{t('deprecation.p2', 'That signal can be automated safely.')}</p>
        <p>{t('deprecation.p3', 'Permanent deletion can remain a deliberate developer decision.')}</p>
      </SeoSection>
      <SeoSection title={t('keykit.title', 'Keykit makes this lifecycle part of normal development')}>
        <p>{t('keykit.description', 'New translation calls create discovery signals. Removed calls create deprecation signals. Instead of periodically auditing a giant translation catalog by hand, teams can clean it as the product evolves.')}</p>
      </SeoSection>
    </MarketingPage>
  );
}

export function ReactTranslationsPage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) => tr(`pages.reactTranslations.${key}`, fallback);

  return (
    <MarketingPage
      slug="react-translations"
      metaTitle={t('seo.metaTitle', 'React Translation Management Without Manual Locale Sync | Keykit')}
      metaDescription={t('seo.metaDescription', 'See how to manage translations in a React application with source-discovered keys, live or static delivery and automatic deprecation when translated UI is removed.')}
      eyebrow={t('hero.eyebrow', 'React translations')}
      title={t('hero.title', 'Translation management for React that follows the code')}
      description={t('hero.description', 'Use normal translation calls in your components, let Keykit discover the keys automatically and stop treating locale-file synchronization as a separate development workflow.')}
      primaryCta={{ label: t('hero.primaryCta', 'Try Keykit with React'), href: join }}
      secondaryCta={{ label: t('hero.secondaryCta', 'See the example'), href: '#example' }}
      finalCta={{
        title: t('finalCta.title', 'Write the translation call and keep building'),
        description: t('finalCta.description', 'Let Keykit handle discovery, translation state and stale-key detection around your React application.'),
        button: t('finalCta.button', 'Use Keykit with React'),
      }}
      faq={{
        title: t('faq.title', 'React translation FAQ'),
        items: [
          { question: t('faq.items.builtIn.question', 'Does React have built-in translation support?'), answer: t('faq.items.builtIn.answer', 'React itself does not provide a complete localization system. Applications need a translation strategy for locale selection, formatting and message lookup.') },
          { question: t('faq.items.json.question', 'Do I need locale JSON files?'), answer: t('faq.items.json.answer', 'Not necessarily. Keykit can support a live delivery model, while teams that prefer static resources can pull translations into the application with the CLI.') },
          { question: t('faq.items.discovery.question', 'How does Keykit find translation keys in React?'), answer: t('faq.items.discovery.answer', 'Keykit analyzes supported translation calls and records static keys referenced by the connected source.') },
          { question: t('faq.items.removed.question', 'What happens when I delete a component containing translations?'), answer: t('faq.items.removed.answer', 'Keys that were previously detected but disappear from source can be marked as no longer detected or deprecated for review.') },
        ],
      }}
    >
      <SeoSection title={t('setup.title', 'The component should stay simple')}>
        <p>{t('setup.description', 'Localization should not make every component understand how translations are stored, synchronized or generated.')}</p>
        <CodeBlock code={sdkExample} />
        <p>{t('setup.caption', 'The React component only asks for the translations it needs. Keykit handles the translation-key workflow around those calls.')}</p>
      </SeoSection>
      <SeoSection title={t('adding.title', 'Adding a new string should be part of adding the feature')}>
        <p>{t('adding.description', 'When a developer introduces a translated label, there should not be a second checklist item saying to register that key somewhere else.')}</p>
        <SeoCards
          items={[
            { title: t('adding.steps.code', '1. Add the translation call in React.'), description: t('adding.steps.discover', '2. Keykit discovers the new key.') },
            { title: t('adding.steps.translate', '3. Missing languages become visible and can be translated.'), description: t('adding.steps.ship', "4. The application consumes the translation using the project's delivery mode.") },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('live.title', 'Option 1: load translations live')}>
        <p>{t('live.description', 'With delivery: "live", the React application can load translation data from Keykit rather than depending on checked-in locale files.')}</p>
        <p>{t('live.benefit', 'Translation changes can move independently from application source changes.')}</p>
      </SeoSection>
      <SeoSection title={t('static.title', 'Option 2: keep translations static')}>
        <p>{t('static.description', 'If you prefer translation resources to be bundled with the application, set delivery: "static" and pull the latest translations with the CLI.')}</p>
        <p>{t('static.workflow', 'Keykit project → CLI pull → static locale resources → React build')}</p>
        <CodeBlock code={'npx @keykithq/cli pull'} />
      </SeoSection>
      <SeoSection title={t('example.title', 'A small React example')}>
        <div id="example" />
        <p>{t('example.description', 'Keykit can discover both static translation identifiers from the component. The developer does not need to mirror those keys manually in a second system before continuing the feature.')}</p>
        <CodeBlock
          code={`export function ProjectHeader({ project }) {
  const { translate } = useKeykit();
  return (
    <header>
      <span>{translate('projects.header.eyebrow', 'Project')}</span>
      <h1>{project.name}</h1>
      <Button>{translate('projects.actions.edit', 'Edit')}</Button>
    </header>
  );
}`}
        />
      </SeoSection>
    </MarketingPage>
  );
}

export function NextjsTranslationsPage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) => tr(`pages.nextjsTranslations.${key}`, fallback);

  return (
    <MarketingPage
      slug="nextjs-translations"
      metaTitle={t('seo.metaTitle', 'Next.js App Router Translations — Server and Client Components | Keykit')}
      metaDescription={t('seo.metaDescription', 'A practical Next.js App Router translation setup using Keykit across Server Components, Client Components and localized metadata.')}
      eyebrow={t('hero.eyebrow', 'Next.js translations')}
      title={t('hero.title', 'One translation workflow across Server and Client Components')}
      description={t('hero.description', 'Next.js App Router changes where translation code can run. Keykit keeps server-side and client-side usage on one source-driven translation catalog.')}
      primaryCta={{ label: t('hero.primaryCta', 'Use Keykit with Next.js'), href: join }}
      secondaryCta={{ label: t('hero.secondaryCta', 'View server example'), href: '#server' }}
      finalCta={{
        title: t('finalCta.title', 'Use one translation model across your Next.js application'),
        description: t('finalCta.description', 'Keep Server Components, Client Components and metadata connected to the same source-driven translation lifecycle.'),
        button: t('finalCta.button', 'Start with Next.js'),
      }}
      faq={{
        title: t('faq.title', 'Next.js translation FAQ'),
        items: [
          { question: t('faq.items.server.question', 'Can I translate directly inside a Next.js Server Component?'), answer: t('faq.items.server.answer', 'Yes. The same useKeykit translate call works from the Keykit provider around the app. A page does not need to become a Client Component only to render translated static copy.') },
          { question: t('faq.items.client.question', 'When should I use the client translation hook?'), answer: t('faq.items.client.answer', 'Use useKeykit inside interactive Client Components or when translations need to respond to client-side state.') },
          { question: t('faq.items.metadata.question', 'Can I translate generateMetadata()?'), answer: t('faq.items.metadata.answer', 'Yes. Metadata runs on the server and can read the same Keykit catalog for the locale of the route.') },
          { question: t('faq.items.delivery.question', 'Do translation updates require a Next.js redeploy?'), answer: t('faq.items.delivery.answer', 'That depends on the delivery mode. Static translations are pulled into the application with the CLI. Live delivery resolves translation data independently from static application resources.') },
        ],
      }}
    >
      <SeoSection title={t('routing.title', 'Keep locale routing and translation management as separate concerns')}>
        <p>{t('routing.description', 'A common App Router setup places the locale in the URL and lets the route determine which translations should be used.')}</p>
        <p>{t('routing.note', 'Keykit manages the translation content and key lifecycle. Your Next.js routing strategy still decides which locale is active for a request.')}</p>
      </SeoSection>
      <SeoSection eyebrow={t('server.eyebrow', 'Server Components')} title={t('server.title', 'Translate server-rendered content without turning it into a Client Component')}>
        <div id="server" />
        <p>{t('server.description', 'Static page copy, headings and other server-rendered strings should be translatable directly from the server.')}</p>
        <p>{t('server.benefit', 'The translated content is rendered on the server and does not require converting the page into an interactive client component.')}</p>
        <CodeBlock
          code={`import { useKeykit } from '@keykithq/sdk/react';

export default function ProjectsPage() {
  const { translate } = useKeykit();
  return (
    <main>
      <h1>{translate('projects.title', 'Projects')}</h1>
      <p>{translate('projects.description', 'Your translation projects.')}</p>
    </main>
  );
}`}
        />
      </SeoSection>
      <SeoSection eyebrow={t('client.eyebrow', 'Client Components')} title={t('client.title', 'Use a hook where React needs client-side behavior')}>
        <p>{t('client.description', 'Interactive components can use useKeykit while referencing the same translation catalog.')}</p>
        <CodeBlock
          code={`'use client';
import { useKeykit } from '@keykithq/sdk/react';

export function CreateProjectButton() {
  const { translate } = useKeykit();
  return <Button>{translate('projects.actions.create', 'Create')}</Button>;
}`}
        />
      </SeoSection>
      <SeoSection title={t('delivery.title', 'Choose live or static translation delivery')}>
        <p>{t('delivery.description', 'Next.js teams may want runtime freshness or build-time stability. Set delivery: "live" or delivery: "static".')}</p>
        <SeoCards
          items={[
            { title: t('delivery.live.title', 'Live'), description: t('delivery.live.description', 'Resolve translation data through Keykit so copy can update without maintaining generated translation resources manually.') },
            { title: t('delivery.static.title', 'Static'), description: t('delivery.static.description', 'Pull translation data with npx @keykithq/cli pull and keep it versioned as part of the application build.') },
          ]}
        />
      </SeoSection>
    </MarketingPage>
  );
}

export function TranslationManagementPage() {
  const { translate: tr } = useKeykit();
  const t = (key: string, fallback: string) => tr(`pages.translationManagement.${key}`, fallback);

  return (
    <MarketingPage
      slug="translation-management"
      metaTitle={t('seo.metaTitle', 'Translation Management for Developers | Keykit')}
      metaDescription={t('seo.metaDescription', 'Manage application translations from the code outward. Keykit discovers translation keys, creates missing locale values and tracks stale keys as your product evolves.')}
      eyebrow={t('hero.eyebrow', 'Developer translation management')}
      title={t('hero.title', 'Translation management that starts in the codebase')}
      description={t('hero.description', 'Stop maintaining translation keys as a separate inventory. Keykit discovers the strings your application actually uses and keeps translation state connected to product development.')}
      primaryCta={{ label: t('hero.primaryCta', 'Start with Keykit'), href: join }}
      secondaryCta={{ label: t('hero.secondaryCta', 'See how it works'), href: '/how-it-works' }}
      finalCta={{
        title: t('finalCta.title', 'Manage translation state without maintaining it twice'),
        description: t('finalCta.description', 'Let your application create the signals that keep the translation catalog current.'),
        button: t('finalCta.button', 'Start with Keykit'),
      }}
      faq={{
        title: t('faq.title', 'Translation management FAQ'),
        items: [
          { question: t('faq.items.what.question', 'What is a translation management system?'), answer: t('faq.items.what.answer', 'A translation management system centralizes translation content, languages and localization workflows. Keykit focuses specifically on application translation management with a strong connection to source-code usage.') },
          { question: t('faq.items.files.question', 'Can I keep static locale files?'), answer: t('faq.items.files.answer', "Yes. Use Keykit's static delivery workflow and pull translation resources with npx @keykithq/cli pull.") },
          { question: t('faq.items.live.question', 'Can translations update without rebuilding the app?'), answer: t('faq.items.live.answer', "Use Keykit's live delivery model when runtime translation updates are appropriate for your application.") },
          { question: t('faq.items.stale.question', 'How does Keykit find stale translation keys?'), answer: t('faq.items.stale.answer', 'Keykit can compare previously detected source usage with current source usage. When a key disappears, it can be tagged as no longer detected or deprecated for review.') },
        ],
      }}
    >
      <SeoSection title={t('problem.title', 'Locale files are not the hard part')}>
        <p>{t('problem.description', 'A JSON file is easy. The difficult part is keeping translation state accurate while features, repositories, developers and supported languages keep changing.')}</p>
        <SeoCards
          items={[
            { title: t('problem.items.newKeys.title', 'New keys'), description: t('problem.items.newKeys.description', 'Developers add a feature and need every locale to learn that new strings exist.') },
            { title: t('problem.items.renames.title', 'Renamed keys'), description: t('problem.items.renames.description', 'A cleaner identifier gets introduced while the previous translation entry survives indefinitely.') },
            { title: t('problem.items.stale.title', 'Stale keys'), description: t('problem.items.stale.description', 'The catalog contains strings that may have stopped being used years ago.') },
            { title: t('problem.items.sync.title', 'Synchronization'), description: t('problem.items.sync.description', 'Teams build scripts and CI jobs simply to keep application resources and translation tooling aligned.') },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('features.title', 'Translation management around the full key lifecycle')}>
        <SeoCards
          items={[
            { title: t('features.discovery.title', 'Automatic key discovery'), description: t('features.discovery.description', 'Find supported translation calls in source instead of requiring a second manual registration step.') },
            { title: t('features.translation.title', 'Automatic translation'), description: t('features.translation.description', 'Generate missing locale values when new product strings appear, while keeping them editable by the team.') },
            { title: t('features.deprecation.title', 'Automatic deprecation signals'), description: t('features.deprecation.description', 'Know when a previously detected key disappears from the connected source.') },
            { title: t('features.live.title', 'Live delivery'), description: t('features.live.description', 'Load translation data without maintaining static locale resources manually.') },
            { title: t('features.static.title', 'Static delivery'), description: t('features.static.description', 'Pull translation resources with the CLI when you want them bundled and deployed with the application.') },
          ]}
        />
      </SeoSection>
      <SeoSection title={t('json.title', 'JSON can store translations. It cannot tell you whether they still matter.')}>
        <p>{t('json.p1', 'Static locale files are perfectly valid translation resources.')}</p>
        <p>{t('json.p2', 'What they do not provide on their own is lifecycle information: which source introduced a key, which systems still use it, and whether an old entry is safe to remove.')}</p>
        <p>{t('json.p3', 'Keykit is designed to manage that layer.')}</p>
      </SeoSection>
    </MarketingPage>
  );
}
