# Keykit SEO Pages — Full Implementation Copy

> Build these pages manually under `app/[lang]/...`. Do not introduce a CMS.
>
> Every user-facing string must use Keykit translation calls. Use only `common.*` and `pages.<pageName>.*` namespaces.
>
> Keep page names and nested key groups camelCase.

---

# Global rules

Use page-owned keys:

```tsx
translate("pages.howItWorks.hero.title")
translate("pages.reactTranslations.hero.description")
translate("pages.keykitVsLokalise.comparison.title")
```

Use `common.*` only for truly shared UI copy:

```txt
common.actions.getStarted = "Get started"
common.actions.tryKeykit = "Try Keykit"
common.actions.learnMore = "Learn more"
common.actions.readMore = "Read more"
common.actions.viewDocumentation = "View documentation"

common.labels.active = "Active"
common.labels.deprecated = "Deprecated"
common.labels.notDetected = "No longer detected"
common.labels.keykit = "Keykit"
common.labels.example = "Example"
common.labels.recommended = "Recommended"
```

Do not move page copy into `common` merely because two pages happen to use similar wording.

Every page should implement localized title, meta description, canonical URL, hreflang alternates, Open Graph title and Open Graph description.

Code samples below show the intended DX. Cursor must replace placeholder package/API names with the actual Keykit SDK exports from the repository.

Preserve both Keykit delivery modes:

```ts
delivery: "live"
delivery: "static"
```

For static delivery, use the Keykit CLI pull workflow.

---

# PAGE 1 — How Keykit Works

## Route

```txt
app/[lang]/how-it-works/page.tsx
```

## Namespace

```txt
pages.howItWorks
```

## SEO

```txt
pages.howItWorks.seo.metaTitle
How Keykit Works — Translation Management From Your Code

pages.howItWorks.seo.metaDescription
Keykit discovers translation keys from your application, creates missing translations and tracks when keys are no longer used—without making you maintain a separate translation-key inventory.
```

## Hero

```txt
pages.howItWorks.hero.eyebrow
How Keykit works

pages.howItWorks.hero.title
Your application already knows what needs translating

pages.howItWorks.hero.description
Keykit connects your translation catalog directly to the code using it. Add a normal translation call, let Keykit discover the key, and manage the entire translation lifecycle without keeping a second inventory in sync by hand.

pages.howItWorks.hero.primaryCta
Start with Keykit

pages.howItWorks.hero.secondaryCta
See automatic key discovery
```

Hero visual:

```tsx
translate("projects.create.title")
```

becomes:

```txt
projects.create.title
Status: Active

English
Create project

Swedish
Skapa projekt

German
Projekt erstellen
```

## Section — One line in code starts the workflow

```txt
pages.howItWorks.discovery.eyebrow
Source-driven localization

pages.howItWorks.discovery.title
One translation call is enough to introduce a key

pages.howItWorks.discovery.description
With a traditional workflow, developers often have to think about both the code and the translation system. Keykit treats usage in the application as the important signal. When a new static translation key appears in your source, Keykit can discover it and bring it into the project automatically.
```

Example:

```tsx
function CreateProjectButton() {
  const translate = useTranslate();

  return (
    <Button>
      {translate("projects.actions.create")}
    </Button>
  );
}
```

```txt
pages.howItWorks.discovery.exampleCaption
Keykit sees the key used by the application and adds it to the translation workflow. There is no separate “remember to create this key in the translation dashboard” step.
```

## Section — From discovery to translated UI

```txt
pages.howItWorks.workflow.title
From source code to every supported language

pages.howItWorks.workflow.description
Keykit keeps the translation workflow centered around the product code instead of forcing developers to maintain synchronization plumbing around it.

pages.howItWorks.workflow.steps.write.title
1. Use the key

pages.howItWorks.workflow.steps.write.description
Write a normal translation call where the text belongs. Use a stable, statically analyzable key that describes the product concept.

pages.howItWorks.workflow.steps.discover.title
2. Keykit discovers it

pages.howItWorks.workflow.steps.discover.description
Keykit scans the connected source and recognizes new translation keys used by the application.

pages.howItWorks.workflow.steps.translate.title
3. Missing translations are created

pages.howItWorks.workflow.steps.translate.description
New locale values can be generated automatically, reviewed and edited from the Keykit project.

pages.howItWorks.workflow.steps.deliver.title
4. Your application gets the translations

pages.howItWorks.workflow.steps.deliver.description
Use Keykit's live or static delivery model depending on how you want translations to reach the application.
```

## Section — Live vs static delivery

```txt
pages.howItWorks.delivery.eyebrow
Choose your delivery model

pages.howItWorks.delivery.title
Fetch translations live or keep them as static application resources

pages.howItWorks.delivery.description
Keykit supports two delivery models so teams can choose between runtime freshness and build-time control.

pages.howItWorks.delivery.live.title
Live delivery

pages.howItWorks.delivery.live.description
Load translations from Keykit at runtime so updated copy can become available without maintaining generated locale files manually.

pages.howItWorks.delivery.live.highlight
Useful when you want translation changes to move independently from application builds.

pages.howItWorks.delivery.static.title
Static delivery

pages.howItWorks.delivery.static.description
Keep translations as static resources inside your application and use the Keykit CLI pull workflow to populate them.

pages.howItWorks.delivery.static.highlight
Useful when translations should be versioned, bundled and deployed with the application.
```

## Section — When a key disappears

```txt
pages.howItWorks.deprecation.eyebrow
Automatic lifecycle tracking

pages.howItWorks.deprecation.title
Removing UI should also clean up its translation debt

pages.howItWorks.deprecation.description
Translation systems are good at accumulating keys and much worse at telling you when those keys stopped mattering. Keykit treats disappearance from source as useful information.
```

Before:

```tsx
translate("projects.create.legacyDescription")
```

After a refactor, the call is gone.

```txt
pages.howItWorks.deprecation.resultTitle
Keykit no longer detects the key

pages.howItWorks.deprecation.resultDescription
Instead of immediately deleting the translation, Keykit can mark it as no longer detected or deprecated so the team can review it safely.
```

## Section — Why deprecation comes before deletion

```txt
pages.howItWorks.safeRemoval.title
Unused does not always mean safe to delete

pages.howItWorks.safeRemoval.description
A key may disappear from one frontend while another application, backend service or older deployed version still depends on it. That is why Keykit separates detection from deletion.

pages.howItWorks.safeRemoval.items.otherSource.title
Another source may still use it

pages.howItWorks.safeRemoval.items.otherSource.description
A web app can stop using a key while an admin application or backend service still references it.

pages.howItWorks.safeRemoval.items.rollback.title
A rollback may still need it

pages.howItWorks.safeRemoval.items.rollback.description
Immediate deletion turns a normal refactor into a potentially breaking operation for older deployed code.

pages.howItWorks.safeRemoval.items.review.title
Developers keep the final decision

pages.howItWorks.safeRemoval.items.review.description
Keykit records that a key disappeared and surfaces it for review instead of pretending absence always means deletion is safe.
```

## Section — Key lifecycle

```txt
pages.howItWorks.lifecycle.title
Translation keys have a lifecycle

pages.howItWorks.lifecycle.description
Treating keys as long-lived entities makes localization easier to understand and much safer to clean up.

pages.howItWorks.lifecycle.states.discovered.title
Discovered

pages.howItWorks.lifecycle.states.discovered.description
The key has appeared in a connected source.

pages.howItWorks.lifecycle.states.active.title
Active

pages.howItWorks.lifecycle.states.active.description
The key is currently detected and belongs to the live translation catalog.

pages.howItWorks.lifecycle.states.translated.title
Translated

pages.howItWorks.lifecycle.states.translated.description
Required locales have values available.

pages.howItWorks.lifecycle.states.notDetected.title
No longer detected

pages.howItWorks.lifecycle.states.notDetected.description
A source that previously referenced the key no longer does.

pages.howItWorks.lifecycle.states.deprecated.title
Deprecated

pages.howItWorks.lifecycle.states.deprecated.description
The key has become a cleanup candidate and should be reviewed.

pages.howItWorks.lifecycle.states.removed.title
Removed

pages.howItWorks.lifecycle.states.removed.description
The team has confirmed the key is no longer needed.
```

## Section — Why Keykit exists

```txt
pages.howItWorks.why.title
You should not need a second engineering system just to synchronize strings

pages.howItWorks.why.description
Localization often grows into a collection of extraction scripts, generated files, upload jobs, download jobs, repository integrations and cleanup conventions. Keykit is built around a simpler idea: let source usage drive translation state.

pages.howItWorks.why.note
The exact runtime path depends on whether your project uses live or static delivery.
```

Traditional:

```txt
Source code
→ extraction
→ locale files
→ upload/sync
→ translation platform
→ download/sync
→ locale files
→ build
```

Keykit:

```txt
Source code
↕
Keykit
↕
Application translations
```

## FAQ

```txt
pages.howItWorks.faq.title
How Keykit works

pages.howItWorks.faq.items.replaceLibrary.question
Does Keykit replace my i18n library?

pages.howItWorks.faq.items.replaceLibrary.answer
Keykit manages the translation workflow, key lifecycle and delivery around your application. Runtime concerns such as formatting, interpolation, pluralization and locale routing still depend on the integration and framework you use.

pages.howItWorks.faq.items.discovery.question
How does Keykit discover translation keys?

pages.howItWorks.faq.items.discovery.answer
Keykit analyzes supported translation calls in connected source code and records statically identifiable keys used by the application.

pages.howItWorks.faq.items.deleted.question
Does Keykit immediately delete a key when it disappears?

pages.howItWorks.faq.items.deleted.answer
No. Disappearance from source is a signal, not proof that deletion is safe. Keykit can mark the key as no longer detected or deprecated so it can be reviewed first.

pages.howItWorks.faq.items.existing.question
Can I use Keykit with an existing application?

pages.howItWorks.faq.items.existing.answer
Yes. Existing translations can be brought into the project first, then Keykit can use source discovery to help show which keys are actively detected by the connected application.

pages.howItWorks.faq.items.delivery.question
Do translations have to be fetched at runtime?

pages.howItWorks.faq.items.delivery.answer
No. Keykit supports both live delivery and a static workflow where the CLI pulls translation resources into the application.
```

## Final CTA

```txt
pages.howItWorks.finalCta.title
Let the code drive the translation catalog

pages.howItWorks.finalCta.description
Create translations when features appear, identify stale keys when features disappear, and stop maintaining translation state twice.

pages.howItWorks.finalCta.button
Start with Keykit
```

---

# PAGE 2 — Automatic Translation Key Discovery

## Route

```txt
app/[lang]/automatic-translation-key-discovery/page.tsx
```

## Namespace

```txt
pages.automaticKeyDiscovery
```

## SEO

```txt
pages.automaticKeyDiscovery.seo.metaTitle
Automatic Translation Key Discovery for React and Next.js | Keykit

pages.automaticKeyDiscovery.seo.metaDescription
Discover translation keys directly from your application code, identify new strings automatically and tag keys for deprecation when they disappear.
```

## Hero

```txt
pages.automaticKeyDiscovery.hero.eyebrow
Automatic key discovery

pages.automaticKeyDiscovery.hero.title
Stop registering translation keys twice

pages.automaticKeyDiscovery.hero.description
Your code already contains the information needed to know which translation keys exist. Keykit uses that source information to keep the translation catalog aligned with the application.

pages.automaticKeyDiscovery.hero.primaryCta
Try automatic key discovery

pages.automaticKeyDiscovery.hero.secondaryCta
See how Keykit works
```

## Problem

```txt
pages.automaticKeyDiscovery.problem.title
Translation catalogs drift when code and translation state are maintained separately

pages.automaticKeyDiscovery.problem.description
Every manual synchronization boundary creates another place for application state and translation state to disagree.

pages.automaticKeyDiscovery.problem.items.missing.title
A key exists in code but not in the catalog

pages.automaticKeyDiscovery.problem.items.missing.description
The feature ships before every locale knows the string exists.

pages.automaticKeyDiscovery.problem.items.stale.title
A key exists in the catalog but not in code

pages.automaticKeyDiscovery.problem.items.stale.description
Nobody knows whether it is stale, intentionally retained or still used somewhere else.

pages.automaticKeyDiscovery.problem.items.rename.title
A key is renamed

pages.automaticKeyDiscovery.problem.items.rename.description
The new key appears while the old one quietly survives for years.

pages.automaticKeyDiscovery.problem.items.multiSource.title
Different repositories synchronize differently

pages.automaticKeyDiscovery.problem.items.multiSource.description
The central catalog stops representing the applications that actually consume it.
```

## Core workflow

```txt
pages.automaticKeyDiscovery.workflow.title
Use the translation. Keykit finds the key.

pages.automaticKeyDiscovery.workflow.description
The ideal developer workflow should be no more complicated than writing the translation where it is needed.
```

```tsx
translate("billing.subscription.cancel")
```

```txt
billing.subscription.cancel
Status: Active
Detected in: web
```

```txt
pages.automaticKeyDiscovery.workflow.resultDescription
Keykit can register the key, identify missing languages and keep its source-usage state connected to the application.
```

## Static keys

```txt
pages.automaticKeyDiscovery.staticKeys.title
Predictable keys make automation reliable

pages.automaticKeyDiscovery.staticKeys.description
Static translation identifiers are easier to discover, search, refactor and deprecate safely.

pages.automaticKeyDiscovery.staticKeys.recommendation
Prefer explicit translation keys whenever practical. Dynamic key generation can make it impossible for static analysis to know the complete set of possible translations.
```

Recommended:

```tsx
translate("documents.upload.success")
```

Less analyzable:

```tsx
translate(`documents.${type}.${state}`)
```

## Discovery works both directions

```txt
pages.automaticKeyDiscovery.twoWay.title
The important event is not only when a key appears

pages.automaticKeyDiscovery.twoWay.description
A useful translation system should also notice when a key that used to exist has disappeared.
```

```txt
Appears
→ newly detected
→ create translation entry
→ translate

Disappears
→ no longer detected
→ mark deprecated
→ review
→ remove when safe
```

## Multiple sources

```txt
pages.automaticKeyDiscovery.sources.title
One catalog can have several consumers

pages.automaticKeyDiscovery.sources.description
Applications often share translation infrastructure across more than one codebase. Keykit's source-driven model makes usage information explicit instead of treating the catalog as an isolated list of strings.

pages.automaticKeyDiscovery.sources.note
A key that disappears from one source should not automatically be treated as globally unused while another connected source still depends on it.
```

Diagram:

```txt
Web app ──────┐
Admin app ────┼── Keykit project
Backend ──────┤
Worker ───────┘
```

## Refactoring example

```txt
pages.automaticKeyDiscovery.refactor.title
Translation cleanup can happen naturally during refactoring

pages.automaticKeyDiscovery.refactor.description
When developers rename or remove UI, the translation catalog should be able to follow instead of accumulating every historical version forever.
```

Before:

```tsx
translate("project.delete.confirm")
```

After:

```tsx
translate("projects.delete.confirmation")
```

Result:

```txt
projects.delete.confirmation
→ newly detected

project.delete.confirm
→ no longer detected
→ deprecation candidate
```

## FAQ

```txt
pages.automaticKeyDiscovery.faq.title
Automatic translation-key discovery FAQ

pages.automaticKeyDiscovery.faq.items.what.question
What is translation-key discovery?

pages.automaticKeyDiscovery.faq.items.what.answer
Translation-key discovery is the process of identifying translation identifiers directly from the code that uses them rather than relying only on a separately maintained translation catalog.

pages.automaticKeyDiscovery.faq.items.dynamic.question
Can Keykit discover dynamically generated translation keys?

pages.automaticKeyDiscovery.faq.items.dynamic.answer
Static string keys are the most reliable input for source analysis. Dynamically generated identifiers may require explicit handling because the complete key cannot always be determined from source code.

pages.automaticKeyDiscovery.faq.items.removed.question
What happens when a discovered key is removed from the code?

pages.automaticKeyDiscovery.faq.items.removed.answer
Keykit can record that the key is no longer detected and move it into a deprecation workflow instead of immediately deleting it.

pages.automaticKeyDiscovery.faq.items.multiple.question
Can more than one application contribute key usage?

pages.automaticKeyDiscovery.faq.items.multiple.answer
Keykit is designed around source-aware translation management, so source identity can be used to distinguish where a key is still being detected.
```

## CTA

```txt
pages.automaticKeyDiscovery.finalCta.title
Make translation state follow application state

pages.automaticKeyDiscovery.finalCta.description
Discover new keys when developers add them and surface old keys when the code stops using them.

pages.automaticKeyDiscovery.finalCta.button
Start discovering keys
```

---

# PAGE 3 — Translation Key Lifecycle and Automatic Deprecation

## Route

```txt
app/[lang]/translation-key-lifecycle/page.tsx
```

## Namespace

```txt
pages.translationKeyLifecycle
```

## SEO

```txt
pages.translationKeyLifecycle.seo.metaTitle
Unused Translation Keys: Discovery, Deprecation and Cleanup

pages.translationKeyLifecycle.seo.metaDescription
Why translation catalogs accumulate stale i18n keys, why automatic deletion is risky and how source-driven deprecation makes cleanup safer.
```

## Hero

```txt
pages.translationKeyLifecycle.hero.eyebrow
Translation architecture

pages.translationKeyLifecycle.hero.title
Translation keys are easy to add—and surprisingly hard to remove

pages.translationKeyLifecycle.hero.description
Every feature creates new strings. Every refactor removes some of them. Most translation systems are good at the first half of that lifecycle and leave teams guessing about the second.
```

## Introduction

```txt
pages.translationKeyLifecycle.intro.p1
A developer adds a translation key while building a feature. The application grows, the feature changes and years later nobody remembers which system introduced the key or whether it is still safe to remove.

pages.translationKeyLifecycle.intro.p2
That uncertainty has a predictable result: teams keep old translation keys forever.

pages.translationKeyLifecycle.intro.p3
Do that hundreds or thousands of times and the translation catalog becomes another form of technical debt.
```

## Translation catalogs naturally grow in one direction

```txt
pages.translationKeyLifecycle.growth.title
Translation catalogs naturally grow in one direction

pages.translationKeyLifecycle.growth.p1
Adding a key is low risk. Deleting one can break an interface, email, backend message or older deployed client.

pages.translationKeyLifecycle.growth.p2
So teams behave rationally: they add aggressively and delete cautiously.

pages.translationKeyLifecycle.growth.p3
The result is a catalog containing active product copy, historical copy, renamed keys, abandoned experiments and strings that nobody can confidently classify.
```

## “Unused” is a system-level question

```txt
pages.translationKeyLifecycle.unused.title
“Unused” is a system-level question, not always a repository-level question

pages.translationKeyLifecycle.unused.p1
Searching one frontend repository can tell you that a key is not used by that frontend. It cannot automatically prove that nothing else depends on it.

pages.translationKeyLifecycle.unused.p2
The same translation project may feed several consumers.

pages.translationKeyLifecycle.unused.consumers.web
Web application

pages.translationKeyLifecycle.unused.consumers.admin
Admin application

pages.translationKeyLifecycle.unused.consumers.backend
Backend messages

pages.translationKeyLifecycle.unused.consumers.email
Email templates

pages.translationKeyLifecycle.unused.consumers.worker
Background workers
```

## Sync plumbing

```txt
pages.translationKeyLifecycle.sync.title
The problem gets worse when every system synchronizes translations differently

pages.translationKeyLifecycle.sync.p1
A mature product can end up with translation resources moving through repositories, CI jobs, backend resource files, generated JSON and external translation tooling.

pages.translationKeyLifecycle.sync.p2
Every synchronization step becomes another script, token, convention and failure mode that the team has to maintain.

pages.translationKeyLifecycle.sync.callout
The harder the synchronization system is to understand, the less likely anyone is to trust automated cleanup.
```

Diagram:

```txt
Frontend locale files
      ↕
sync / CI
      ↕
translation platform
      ↕
sync / CI
      ↕
backend resources
```

## Deletion should be a state transition

```txt
pages.translationKeyLifecycle.transition.title
Deletion should be a state transition, not a guess

pages.translationKeyLifecycle.transition.description
A safer model separates the objective fact that a key disappeared from the decision to permanently remove it.
```

```txt
ACTIVE
↓
NO LONGER DETECTED
↓
DEPRECATED
↓
REVIEWED
↓
REMOVED
```

```txt
pages.translationKeyLifecycle.transition.states.active.title
Active

pages.translationKeyLifecycle.transition.states.active.description
At least one relevant source currently references the key.

pages.translationKeyLifecycle.transition.states.notDetected.title
No longer detected

pages.translationKeyLifecycle.transition.states.notDetected.description
A source that previously referenced the key no longer does.

pages.translationKeyLifecycle.transition.states.deprecated.title
Deprecated

pages.translationKeyLifecycle.transition.states.deprecated.description
The key is now a cleanup candidate rather than part of normal active development.

pages.translationKeyLifecycle.transition.states.reviewed.title
Reviewed

pages.translationKeyLifecycle.transition.states.reviewed.description
The team has checked whether another source, deployment or compatibility requirement still needs it.

pages.translationKeyLifecycle.transition.states.removed.title
Removed

pages.translationKeyLifecycle.transition.states.removed.description
The translation entry can now be deleted intentionally.
```

## Automatic deprecation

```txt
pages.translationKeyLifecycle.deprecation.title
Automatic deprecation is more trustworthy than automatic deletion

pages.translationKeyLifecycle.deprecation.p1
Keykit does not need to guess that a translation is invalid. It only needs to record an observable fact: this connected source used to contain the key, and now it does not.

pages.translationKeyLifecycle.deprecation.p2
That signal can be automated safely.

pages.translationKeyLifecycle.deprecation.p3
Permanent deletion can remain a deliberate developer decision.
```

## Multi-source example

```txt
pages.translationKeyLifecycle.multiSource.title
Deprecation becomes more useful when usage is tracked per source

pages.translationKeyLifecycle.multiSource.description
Imagine the key `projects.archive.success` is shared across three parts of the system.
```

State A:

```txt
Web app: No longer detected
Admin app: Active
Backend: Active

Overall: Active
```

State B:

```txt
Web app: No longer detected
Admin app: No longer detected
Backend: No longer detected

Overall: Deprecation candidate
```

```txt
pages.translationKeyLifecycle.multiSource.conclusion
Instead of asking developers to remember every consumer, the translation system can preserve the usage history needed to make cleanup decisions.
```

## Renaming keys

```txt
pages.translationKeyLifecycle.rename.title
Renaming a key should create its own cleanup trail

pages.translationKeyLifecycle.rename.p1
A refactor often creates a better key but leaves the old one behind in the translation system.

pages.translationKeyLifecycle.rename.p2
With source discovery, the new key appears and the old key disappears in the same development cycle.
```

Before:

```txt
project.delete.confirm
```

After:

```txt
projects.delete.confirmation
```

Result:

```txt
projects.delete.confirmation → Active
project.delete.confirm → Deprecated candidate
```

## Recommendations

```txt
pages.translationKeyLifecycle.recommendations.title
A healthier translation-key lifecycle

pages.translationKeyLifecycle.recommendations.items.static.title
Prefer statically analyzable keys

pages.translationKeyLifecycle.recommendations.items.static.description
Explicit keys make discovery, refactoring and lifecycle tracking more reliable.

pages.translationKeyLifecycle.recommendations.items.sources.title
Track source identity

pages.translationKeyLifecycle.recommendations.items.sources.description
Know which codebase is reporting usage instead of treating all keys as globally identical state.

pages.translationKeyLifecycle.recommendations.items.usage.title
Separate usage from existence

pages.translationKeyLifecycle.recommendations.items.usage.description
A translation can exist even when no current source is using it. Those are different facts.

pages.translationKeyLifecycle.recommendations.items.deprecate.title
Deprecate before deleting

pages.translationKeyLifecycle.recommendations.items.deprecate.description
Give teams a reversible state between active use and permanent removal.

pages.translationKeyLifecycle.recommendations.items.review.title
Review stale keys regularly

pages.translationKeyLifecycle.recommendations.items.review.description
Cleanup becomes much easier when the system continuously narrows the list of candidates.
```

## How Keykit handles it

```txt
pages.translationKeyLifecycle.keykit.title
Keykit makes this lifecycle part of normal development

pages.translationKeyLifecycle.keykit.description
New translation calls create discovery signals. Removed calls create deprecation signals. Instead of periodically auditing a giant translation catalog by hand, teams can clean it as the product evolves.
```

Flow:

```txt
source usage
→ discovery
→ active key
→ source disappears
→ automatic deprecation tag
→ review
→ remove
```

## FAQ

```txt
pages.translationKeyLifecycle.faq.title
Translation-key cleanup FAQ

pages.translationKeyLifecycle.faq.items.find.question
How do I find unused translation keys?

pages.translationKeyLifecycle.faq.items.find.answer
The safest approach is to compare translation entries with usage across every relevant source rather than searching only one codebase.

pages.translationKeyLifecycle.faq.items.autoDelete.question
Is it safe to automatically delete unused i18n keys?

pages.translationKeyLifecycle.faq.items.autoDelete.answer
Usually not immediately. A key can be absent from one source while still being needed elsewhere. Automatically marking it as no longer detected or deprecated is safer than permanent deletion.

pages.translationKeyLifecycle.faq.items.rename.question
What should happen when I rename a translation key?

pages.translationKeyLifecycle.faq.items.rename.answer
The new key should become active while the previous key becomes a deprecation candidate once it is no longer detected.

pages.translationKeyLifecycle.faq.items.backend.question
What if a backend system also uses the translations?

pages.translationKeyLifecycle.faq.items.backend.answer
Track the backend as another relevant source when possible. A key should not be considered globally unused merely because the frontend stopped using it.
```

## CTA

```txt
pages.translationKeyLifecycle.finalCta.title
Let refactoring clean up localization debt too

pages.translationKeyLifecycle.finalCta.description
Keykit turns source changes into translation lifecycle changes automatically.

pages.translationKeyLifecycle.finalCta.button
See automatic key discovery
```

---

# PAGE 4 — React Translation Management

## Route

```txt
app/[lang]/react-translations/page.tsx
```

## Namespace

```txt
pages.reactTranslations
```

## SEO

```txt
pages.reactTranslations.seo.metaTitle
React Translation Management Without Manual Locale Sync | Keykit

pages.reactTranslations.seo.metaDescription
See how to manage translations in a React application with source-discovered keys, live or static delivery and automatic deprecation when translated UI is removed.
```

## Hero

```txt
pages.reactTranslations.hero.eyebrow
React translations

pages.reactTranslations.hero.title
Translation management for React that follows the code

pages.reactTranslations.hero.description
Use normal translation calls in your components, let Keykit discover the keys automatically and stop treating locale-file synchronization as a separate development workflow.

pages.reactTranslations.hero.primaryCta
Try Keykit with React

pages.reactTranslations.hero.secondaryCta
See the example
```

## Basic setup

```txt
pages.reactTranslations.setup.title
The component should stay simple

pages.reactTranslations.setup.description
Localization should not make every component understand how translations are stored, synchronized or generated.
```

Adapt to real SDK:

```tsx
import { useTranslate } from "@keykithq/react";

export function EmptyState() {
  const translate = useTranslate();

  return (
    <section>
      <h2>{translate("projects.empty.title")}</h2>
      <p>{translate("projects.empty.description")}</p>
    </section>
  );
}
```

```txt
pages.reactTranslations.setup.caption
The React component only asks for the translations it needs. Keykit handles the translation-key workflow around those calls.
```

## Adding a new string

```txt
pages.reactTranslations.adding.title
Adding a new string should be part of adding the feature

pages.reactTranslations.adding.description
When a developer introduces a translated label, there should not be a second checklist item saying “remember to register this key somewhere else.”

pages.reactTranslations.adding.steps.code
1. Add the translation call in React.

pages.reactTranslations.adding.steps.discover
2. Keykit discovers the new key.

pages.reactTranslations.adding.steps.translate
3. Missing languages become visible and can be translated.

pages.reactTranslations.adding.steps.ship
4. The application consumes the translation using the project's delivery mode.
```

```tsx
<Button>
  {translate("projects.actions.create")}
</Button>
```

## Key structure

```txt
pages.reactTranslations.structure.title
Name keys after product meaning, not temporary component names

pages.reactTranslations.structure.description
React components are refactored frequently. Translation identifiers often live much longer.

pages.reactTranslations.structure.note
A domain-oriented key remains understandable even if a modal becomes a page or a component gets renamed.
```

Recommended:

```txt
projects.list.title
projects.details.owner
projects.actions.create
users.invitation.title
users.invitation.actions.send
```

Less durable:

```txt
ProjectListPage.title
ProjectDetailsCard.ownerText
InviteUserModal.submitButton
```

## Dynamic keys

```txt
pages.reactTranslations.dynamic.title
Avoid hiding your translation inventory behind dynamic key construction

pages.reactTranslations.dynamic.description
Dynamic keys may look concise but make static discovery and cleanup substantially harder.

pages.reactTranslations.dynamic.note
Use an explicit pattern that your tooling can understand whenever the complete set of possible translations is known ahead of time.
```

```tsx
translate(`projects.status.${status}`)
```

Prefer explicit values when possible.

## Live delivery

```txt
pages.reactTranslations.live.title
Option 1: load translations live

pages.reactTranslations.live.description
With live delivery, the React application can load translation data from Keykit rather than depending on checked-in locale files.

pages.reactTranslations.live.benefit
Translation changes can move independently from application source changes.
```

## Static delivery

```txt
pages.reactTranslations.static.title
Option 2: keep translations static

pages.reactTranslations.static.description
If you prefer translation resources to be bundled with the application, use Keykit's static delivery workflow and pull the latest translations with the CLI.

pages.reactTranslations.static.exampleTitle
Example workflow

pages.reactTranslations.static.workflow
Keykit project → CLI pull → static locale resources → React build
```

```bash
keykit pull
```

## Component deletion

```txt
pages.reactTranslations.deletion.title
Deleting the component can deprecate its translations too

pages.reactTranslations.deletion.description
Suppose a component contains a key that disappears completely during a redesign.

pages.reactTranslations.deletion.result
On a later discovery cycle, Keykit can mark `projects.empty.legacyHint` as no longer detected instead of leaving it indistinguishable from active product copy.
```

Before:

```tsx
<p>{translate("projects.empty.legacyHint")}</p>
```

After: component and translation call removed.

## Full example

```txt
pages.reactTranslations.example.title
A small React example

pages.reactTranslations.example.description
Keykit can discover both static translation identifiers from the component. The developer does not need to mirror those keys manually in a second system before continuing the feature.
```

```tsx
export function ProjectHeader({ project }: Props) {
  const translate = useTranslate();

  return (
    <header>
      <div>
        <span>{translate("projects.header.eyebrow")}</span>
        <h1>{project.name}</h1>
      </div>

      <Button>
        {translate("projects.actions.edit")}
      </Button>
    </header>
  );
}
```

## FAQ

```txt
pages.reactTranslations.faq.title
React translation FAQ

pages.reactTranslations.faq.items.builtIn.question
Does React have built-in translation support?

pages.reactTranslations.faq.items.builtIn.answer
React itself does not provide a complete localization system. Applications need a translation/runtime strategy for locale selection, formatting and message lookup.

pages.reactTranslations.faq.items.json.question
Do I need locale JSON files?

pages.reactTranslations.faq.items.json.answer
Not necessarily. Keykit can support a live delivery model, while teams that prefer static resources can pull translations into the application with the CLI.

pages.reactTranslations.faq.items.discovery.question
How does Keykit find translation keys in React?

pages.reactTranslations.faq.items.discovery.answer
Keykit analyzes supported translation calls and records static keys referenced by the connected source.

pages.reactTranslations.faq.items.removed.question
What happens when I delete a component containing translations?

pages.reactTranslations.faq.items.removed.answer
Keys that were previously detected but disappear from source can be marked as no longer detected or deprecated for review.
```

## CTA

```txt
pages.reactTranslations.finalCta.title
Write the translation call and keep building

pages.reactTranslations.finalCta.description
Let Keykit handle discovery, translation state and stale-key detection around your React application.

pages.reactTranslations.finalCta.button
Use Keykit with React
```

---

# PAGE 5 — Next.js App Router Translations

## Route

```txt
app/[lang]/nextjs-translations/page.tsx
```

## Namespace

```txt
pages.nextjsTranslations
```

## SEO

```txt
pages.nextjsTranslations.seo.metaTitle
Next.js App Router Translations — Server and Client Components | Keykit

pages.nextjsTranslations.seo.metaDescription
A practical Next.js App Router translation setup using Keykit across Server Components, Client Components and localized metadata.
```

## Hero

```txt
pages.nextjsTranslations.hero.eyebrow
Next.js translations

pages.nextjsTranslations.hero.title
One translation workflow across Server and Client Components

pages.nextjsTranslations.hero.description
Next.js App Router changes where translation code can run. Keykit should make server-side and client-side usage feel consistent while keeping one source-driven translation catalog.

pages.nextjsTranslations.hero.primaryCta
Use Keykit with Next.js

pages.nextjsTranslations.hero.secondaryCta
View server example
```

## Route structure

```txt
pages.nextjsTranslations.routing.title
Keep locale routing and translation management as separate concerns

pages.nextjsTranslations.routing.description
A common App Router setup places the locale in the URL and lets the route determine which translations should be used.

pages.nextjsTranslations.routing.note
Keykit manages the translation content and key lifecycle. Your Next.js routing strategy still decides which locale is active for a request.
```

```txt
app/
  [lang]/
    layout.tsx
    page.tsx
    projects/
      page.tsx
```

```txt
/en/projects
/sv/projects
/de/projects
```

## Server Components

```txt
pages.nextjsTranslations.server.eyebrow
Server Components

pages.nextjsTranslations.server.title
Translate server-rendered content without turning it into a Client Component

pages.nextjsTranslations.server.description
Static page copy, headings and other server-rendered strings should be translatable directly from the server.

pages.nextjsTranslations.server.benefit
The translated content is rendered on the server and does not require converting the page into an interactive client component.
```

Adapt API to real SDK:

```tsx
export default async function ProjectsPage({ params }: Props) {
  const { lang } = await params;
  const translate = await getTranslator(lang);

  return (
    <main>
      <h1>{translate("projects.title")}</h1>
      <p>{translate("projects.description")}</p>
    </main>
  );
}
```

## Client Components

```txt
pages.nextjsTranslations.client.eyebrow
Client Components

pages.nextjsTranslations.client.title
Use a hook where React needs client-side behavior

pages.nextjsTranslations.client.description
Interactive components can use the client translation API while referencing the same translation catalog.
```

```tsx
"use client";

export function CreateProjectButton() {
  const translate = useTranslate();

  return (
    <Button>
      {translate("projects.actions.create")}
    </Button>
  );
}
```

## Shared key across server and client

```txt
pages.nextjsTranslations.shared.title
Server and client usage should still represent one translation key

pages.nextjsTranslations.shared.description
The runtime location of a translation does not change its product meaning.

pages.nextjsTranslations.shared.result
Keykit should treat these as usage locations for the same key rather than forcing duplicate translation entries.
```

Server:

```tsx
translate("projects.actions.create")
```

Client:

```tsx
translate("projects.actions.create")
```

## Metadata

```txt
pages.nextjsTranslations.metadata.title
Localize Next.js metadata on the server

pages.nextjsTranslations.metadata.description
Page titles and descriptions are user-facing copy too, and they should use the same translation system as the rest of the route.
```

```tsx
export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  const translate = await getTranslator(lang);

  return {
    title: translate("projects.seo.metaTitle"),
    description: translate("projects.seo.metaDescription"),
  };
}
```

## Automatic discovery

```txt
pages.nextjsTranslations.discovery.title
Discover translation calls across the App Router codebase

pages.nextjsTranslations.discovery.description
Keykit's source analysis should make the server/client boundary irrelevant to translation inventory. A static key is still a key whether it appears in a Server Component, Client Component or metadata function.

pages.nextjsTranslations.discovery.items.server
Server Components

pages.nextjsTranslations.discovery.items.client
Client Components

pages.nextjsTranslations.discovery.items.metadata
Metadata functions

pages.nextjsTranslations.discovery.items.utilities
Shared utilities
```

## Delivery

```txt
pages.nextjsTranslations.delivery.title
Choose live or static translation delivery

pages.nextjsTranslations.delivery.description
Next.js teams may want runtime freshness or build-time stability. Keykit supports both styles.

pages.nextjsTranslations.delivery.live.title
Live

pages.nextjsTranslations.delivery.live.description
Resolve translation data through Keykit's live delivery path so copy can update without maintaining generated translation resources manually.

pages.nextjsTranslations.delivery.static.title
Static

pages.nextjsTranslations.delivery.static.description
Pull translation data with the Keykit CLI and keep it versioned or bundled as part of the application build.
```

## Refactoring

```txt
pages.nextjsTranslations.refactor.title
Route refactors should not leave dead translations behind forever

pages.nextjsTranslations.refactor.description
If a route, Server Component or Client Component disappears, keys that were unique to that code can become automatic deprecation candidates.
```

Example:

```txt
Old:
app/[lang]/projects/create/page.tsx
→ projects.create.instructions

New:
route redesigned
→ key no longer exists in source

Result:
projects.create.instructions
Status: No longer detected
```

## FAQ

```txt
pages.nextjsTranslations.faq.title
Next.js translation FAQ

pages.nextjsTranslations.faq.items.server.question
Can I translate directly inside a Next.js Server Component?

pages.nextjsTranslations.faq.items.server.answer
Yes, provided the integration exposes a server-side translator that can resolve the locale for the request. The page should not need to become a Client Component only to render translated static copy.

pages.nextjsTranslations.faq.items.client.question
When should I use the client translation hook?

pages.nextjsTranslations.faq.items.client.answer
Use the client API inside interactive Client Components or when translations need to respond to client-side state.

pages.nextjsTranslations.faq.items.metadata.question
Can I translate generateMetadata()?

pages.nextjsTranslations.faq.items.metadata.answer
Yes. Metadata runs on the server and can use the server translation API with the locale from the route.

pages.nextjsTranslations.faq.items.delivery.question
Do translation updates require a Next.js redeploy?

pages.nextjsTranslations.faq.items.delivery.answer
That depends on the delivery mode. Static translations are bundled or pulled into the application workflow, while live delivery is designed to resolve translation data independently from static application resources.
```

## CTA

```txt
pages.nextjsTranslations.finalCta.title
Use one translation model across your Next.js application

pages.nextjsTranslations.finalCta.description
Keep Server Components, Client Components and metadata connected to the same source-driven translation lifecycle.

pages.nextjsTranslations.finalCta.button
Start with Next.js
```

---

# PAGE 6 — Translation Management for Developers

## Route

```txt
app/[lang]/translation-management/page.tsx
```

## Namespace

```txt
pages.translationManagement
```

## SEO

```txt
pages.translationManagement.seo.metaTitle
Translation Management for Developers | Keykit

pages.translationManagement.seo.metaDescription
Manage application translations from the code outward. Keykit discovers translation keys, creates missing locale values and tracks stale keys as your product evolves.
```

## Hero

```txt
pages.translationManagement.hero.eyebrow
Developer translation management

pages.translationManagement.hero.title
Translation management that starts in the codebase

pages.translationManagement.hero.description
Stop maintaining translation keys as a separate inventory. Keykit discovers the strings your application actually uses and keeps translation state connected to product development.

pages.translationManagement.hero.primaryCta
Start with Keykit

pages.translationManagement.hero.secondaryCta
See how it works
```

## Problem

```txt
pages.translationManagement.problem.title
Locale files are not the hard part

pages.translationManagement.problem.description
A JSON file is easy. The difficult part is keeping translation state accurate while features, repositories, developers and supported languages keep changing.

pages.translationManagement.problem.items.newKeys.title
New keys

pages.translationManagement.problem.items.newKeys.description
Developers add a feature and need every locale to learn that new strings exist.

pages.translationManagement.problem.items.renames.title
Renamed keys

pages.translationManagement.problem.items.renames.description
A cleaner identifier gets introduced while the previous translation entry survives indefinitely.

pages.translationManagement.problem.items.stale.title
Stale keys

pages.translationManagement.problem.items.stale.description
The catalog contains strings that may have stopped being used years ago.

pages.translationManagement.problem.items.sync.title
Synchronization

pages.translationManagement.problem.items.sync.description
Teams build scripts and CI jobs simply to keep application resources and translation tooling aligned.
```

## Solution

```txt
pages.translationManagement.solution.title
Make the application the source of translation usage

pages.translationManagement.solution.description
Keykit lets developers keep using explicit translation identifiers while automatically connecting those identifiers to a managed translation catalog.

pages.translationManagement.solution.result
That call tells Keykit something important: `settings.profile.save` belongs to the current application.
```

```tsx
translate("settings.profile.save")
```

## Feature grid

```txt
pages.translationManagement.features.title
Translation management around the full key lifecycle

pages.translationManagement.features.discovery.title
Automatic key discovery

pages.translationManagement.features.discovery.description
Find supported translation calls in source instead of requiring a second manual registration step.

pages.translationManagement.features.translation.title
Automatic translation

pages.translationManagement.features.translation.description
Generate missing locale values when new product strings appear, while keeping them editable by the team.

pages.translationManagement.features.search.title
Search the catalog

pages.translationManagement.features.search.description
Find translations by key or source text when you need to understand what already exists.

pages.translationManagement.features.deprecation.title
Automatic deprecation signals

pages.translationManagement.features.deprecation.description
Know when a previously detected key disappears from the connected source.

pages.translationManagement.features.live.title
Live delivery

pages.translationManagement.features.live.description
Load translation data without maintaining static locale resources manually.

pages.translationManagement.features.static.title
Static delivery

pages.translationManagement.features.static.description
Pull translation resources with the CLI when you want them bundled and deployed with the application.
```

## Workflow

```txt
pages.translationManagement.workflow.title
Localization should follow the feature

pages.translationManagement.workflow.description
The translation workflow can happen as a consequence of normal product development instead of becoming a parallel process developers have to remember.
```

```txt
1. Build the feature
2. Add translation calls
3. Keykit discovers new keys
4. Missing languages are generated or reviewed
5. Ship
6. Refactor later
7. Removed keys become deprecation candidates
```

## Why not only JSON?

```txt
pages.translationManagement.json.title
JSON can store translations. It cannot tell you whether they still matter.

pages.translationManagement.json.p1
Static locale files are perfectly valid translation resources.

pages.translationManagement.json.p2
What they do not provide on their own is lifecycle information: which source introduced a key, which systems still use it, whether it disappeared during a refactor or whether an old entry is safe to remove.

pages.translationManagement.json.p3
Keykit is designed to manage that layer.
```

## Frameworks

```txt
pages.translationManagement.frameworks.title
Use the same translation model across modern React applications

pages.translationManagement.frameworks.react.title
React

pages.translationManagement.frameworks.react.description
Use a client translation API in normal React components while Keykit discovers the referenced keys.

pages.translationManagement.frameworks.next.title
Next.js

pages.translationManagement.frameworks.next.description
Translate Server Components, Client Components and metadata while keeping one shared catalog.
```

## FAQ

```txt
pages.translationManagement.faq.title
Translation management FAQ

pages.translationManagement.faq.items.what.question
What is a translation management system?

pages.translationManagement.faq.items.what.answer
A translation management system centralizes translation content, languages and localization workflows. Keykit focuses specifically on application translation management with a strong connection to source-code usage.

pages.translationManagement.faq.items.files.question
Can I keep static locale files?

pages.translationManagement.faq.items.files.answer
Yes. Use Keykit's static delivery workflow and pull translation resources with the CLI.

pages.translationManagement.faq.items.live.question
Can translations update without rebuilding the app?

pages.translationManagement.faq.items.live.answer
Use Keykit's live delivery model when runtime translation updates are appropriate for your application.

pages.translationManagement.faq.items.stale.question
How does Keykit find stale translation keys?

pages.translationManagement.faq.items.stale.answer
Keykit can compare previously detected source usage with current source usage. When a key disappears, it can be tagged as no longer detected or deprecated for review.
```

## CTA

```txt
pages.translationManagement.finalCta.title
Manage translation state without maintaining it twice

pages.translationManagement.finalCta.description
Let your application create the signals that keep the translation catalog current.

pages.translationManagement.finalCta.button
Start with Keykit
```

---

# PAGE 7 — Keykit vs Lokalise

## Route

```txt
app/[lang]/keykit-vs-lokalise/page.tsx
```

## Namespace

```txt
pages.keykitVsLokalise
```

## SEO

```txt
pages.keykitVsLokalise.seo.metaTitle
Keykit vs Lokalise — Developer Translation Workflow Comparison

pages.keykitVsLokalise.seo.metaDescription
Compare Keykit's source-driven translation-key lifecycle with Lokalise's broader localization management platform and developer automation ecosystem.
```

## Hero

```txt
pages.keykitVsLokalise.hero.eyebrow
Keykit vs Lokalise

pages.keykitVsLokalise.hero.title
Two ways to automate software localization

pages.keykitVsLokalise.hero.description
Lokalise is a broad localization platform with repository integrations, APIs, CLI tooling, translation workflows and collaboration features. Keykit is narrower: it is built around discovering application translation keys from source code and managing their lifecycle automatically.

pages.keykitVsLokalise.hero.primaryCta
Try Keykit

pages.keykitVsLokalise.hero.secondaryCta
See how Keykit works
```

## Short answer

```txt
pages.keykitVsLokalise.summary.title
The short version

pages.keykitVsLokalise.summary.keykit.title
Choose Keykit when

pages.keykitVsLokalise.summary.keykit.description
Your main problem is keeping application translation keys synchronized with React, Next.js or other product code without maintaining a separate key inventory and cleanup process.

pages.keykitVsLokalise.summary.competitor.title
Choose Lokalise when

pages.keykitVsLokalise.summary.competitor.description
You need a broad localization-management environment with mature translation workflows, repository integrations, collaboration tooling and a larger localization operation.
```

## Different starting points

```txt
pages.keykitVsLokalise.philosophy.title
The biggest difference is where translation state starts

pages.keykitVsLokalise.philosophy.description
Both products aim to automate localization. Keykit's core model begins with translation usage in the application itself.

pages.keykitVsLokalise.philosophy.note
Lokalise provides substantial automation around repository and localization workflows. Keykit's distinction is that source-key discovery and key deprecation are the center of the product model rather than an external synchronization concern.
```

Keykit:

```tsx
translate("billing.actions.upgrade")
```

```txt
source usage
→ discovered by Keykit
→ translation entry
→ translations
```

Broader continuous-localization model:

```txt
application translation resources
↔ repository/API/CLI/integration
↔ localization platform
```

## New key workflow

```txt
pages.keykitVsLokalise.newKey.title
Keykit optimizes for the moment a developer adds the string

pages.keykitVsLokalise.newKey.description
Keykit is designed so the developer can introduce a key by using it in normal application code.

pages.keykitVsLokalise.newKey.result
That source usage becomes the signal that the translation entry should exist.
```

## Old key workflow

```txt
pages.keykitVsLokalise.oldKey.title
The more unusual part is what happens when the feature disappears

pages.keykitVsLokalise.oldKey.description
Keykit also watches the inverse event: a translation key that used to be detected no longer appears in the source.

pages.keykitVsLokalise.oldKey.result
Instead of letting it quietly remain in the catalog forever, Keykit can move it into a deprecated or no-longer-detected state for review.
```

## Keykit fit

```txt
pages.keykitVsLokalise.fit.keykit.title
Keykit is likely the better fit when

pages.keykitVsLokalise.fit.keykit.items.engineering
Localization is primarily owned by the product engineering team.

pages.keykitVsLokalise.fit.keykit.items.react
React or Next.js is central to the product stack.

pages.keykitVsLokalise.fit.keykit.items.sync
You want to remove translation-file and key-registration synchronization work.

pages.keykitVsLokalise.fit.keykit.items.cleanup
Stale keys and cleanup are a recurring technical-debt problem.

pages.keykitVsLokalise.fit.keykit.items.simple
You prefer a focused developer tool over a broad localization suite.
```

## Lokalise fit

```txt
pages.keykitVsLokalise.fit.competitor.title
Lokalise may be the better fit when

pages.keykitVsLokalise.fit.competitor.items.operations
You have a dedicated localization operation with project managers and translators.

pages.keykitVsLokalise.fit.competitor.items.workflow
Advanced translation workflows and collaboration are more important than source-driven key lifecycle.

pages.keykitVsLokalise.fit.competitor.items.integrations
You depend on a broad existing ecosystem of repository, design and localization integrations.

pages.keykitVsLokalise.fit.competitor.items.assets
Your localization program covers many content types beyond application translation keys.
```

## FAQ

```txt
pages.keykitVsLokalise.faq.title
Keykit vs Lokalise FAQ

pages.keykitVsLokalise.faq.items.alternative.question
Is Keykit a Lokalise alternative?

pages.keykitVsLokalise.faq.items.alternative.answer
For developer-led application translation management, yes. The products have different scopes: Lokalise is a broader localization platform, while Keykit focuses heavily on source-discovered application translation keys and their lifecycle.

pages.keykitVsLokalise.faq.items.migrate.question
Can I migrate translations from Lokalise to Keykit?

pages.keykitVsLokalise.faq.items.migrate.answer
The intended migration path is to bring existing translation data into Keykit first, preserve the current keys, then connect source discovery so Keykit can identify which imported keys are actively used.

pages.keykitVsLokalise.faq.items.better.question
Which is better for a small React or Next.js team?

pages.keykitVsLokalise.faq.items.better.answer
If the team's main concern is keeping application translations synchronized with code and cleaning up stale keys automatically, Keykit's narrower workflow may be a better fit. Teams needing broader localization operations may prefer Lokalise.
```

## CTA

```txt
pages.keykitVsLokalise.finalCta.title
Prefer source-driven translation management?

pages.keykitVsLokalise.finalCta.description
Let your application tell the translation system which keys exist and when they stop being used.

pages.keykitVsLokalise.finalCta.button
Try Keykit
```

---

# PAGE 8 — Keykit vs Phrase

## Route

```txt
app/[lang]/keykit-vs-phrase/page.tsx
```

## Namespace

```txt
pages.keykitVsPhrase
```

## SEO

```txt
pages.keykitVsPhrase.seo.metaTitle
Keykit vs Phrase Strings — Developer Localization Comparison

pages.keykitVsPhrase.seo.metaDescription
Compare Keykit's source-driven translation-key lifecycle with Phrase Strings and its broader localization-management workflow.
```

## Hero

```txt
pages.keykitVsPhrase.hero.eyebrow
Keykit vs Phrase

pages.keykitVsPhrase.hero.title
A focused developer translation tool vs a broader localization platform

pages.keykitVsPhrase.hero.description
Phrase Strings supports structured translation projects, localization files, CLI/API workflows, integrations and enterprise localization processes. Keykit focuses on making application translation keys originate from and stay connected to the code using them.

pages.keykitVsPhrase.hero.primaryCta
Try Keykit
```

## Summary

```txt
pages.keykitVsPhrase.summary.title
The practical difference

pages.keykitVsPhrase.summary.description
Phrase is designed to cover a wide localization-management surface. Keykit deliberately focuses on a smaller engineering problem: discovering translation keys from application source, translating them and tracking their lifecycle as the code changes.
```

## Model

```txt
pages.keykitVsPhrase.model.title
Keykit treats source usage as first-class translation state

pages.keykitVsPhrase.model.description
Localization files and projects are useful representations of translation data. Keykit adds another piece of information that matters to engineers: where the key is actually being used now.

pages.keykitVsPhrase.model.result
Keykit can discover application keys from source. If a feature is later redesigned away, the old identifiers can become deprecation candidates automatically.
```

## Keykit fit

```txt
pages.keykitVsPhrase.fit.keykit.title
Consider Keykit when

pages.keykitVsPhrase.fit.keykit.items.developers
The engineering team owns most translation setup and maintenance.

pages.keykitVsPhrase.fit.keykit.items.source
You want translation inventory to follow actual source usage.

pages.keykitVsPhrase.fit.keykit.items.cleanup
You want removed features to create automatic stale-key signals.

pages.keykitVsPhrase.fit.keykit.items.scope
You do not need the breadth of a large enterprise localization suite.
```

## Phrase fit

```txt
pages.keykitVsPhrase.fit.competitor.title
Consider Phrase when

pages.keykitVsPhrase.fit.competitor.items.enterprise
You are running a larger or more formal localization program.

pages.keykitVsPhrase.fit.competitor.items.files
Your workflow is centered around many localization file formats and established import/export processes.

pages.keykitVsPhrase.fit.competitor.items.jobs
Translation jobs, spaces, governance and broader localization operations are central requirements.

pages.keykitVsPhrase.fit.competitor.items.ecosystem
You already depend on Phrase's integration and localization ecosystem.
```

## FAQ

```txt
pages.keykitVsPhrase.faq.title
Keykit vs Phrase FAQ

pages.keykitVsPhrase.faq.items.alternative.question
Is Keykit a Phrase Strings alternative?

pages.keykitVsPhrase.faq.items.alternative.answer
Keykit can be an alternative for teams primarily managing translations for their own applications. Phrase has a broader localization scope, while Keykit is intentionally centered on developer source usage and translation-key lifecycle.

pages.keykitVsPhrase.faq.items.cleanup.question
What is the main Keykit difference?

pages.keykitVsPhrase.faq.items.cleanup.answer
Keykit is designed to discover when a key appears in application source and when it later disappears, turning those changes into translation lifecycle state automatically.
```

## CTA

```txt
pages.keykitVsPhrase.finalCta.title
Keep the translation catalog closer to the application

pages.keykitVsPhrase.finalCta.description
Use source discovery instead of maintaining translation inventory as a separate engineering concern.

pages.keykitVsPhrase.finalCta.button
Try Keykit
```

---

# PAGE 9 — Keykit vs Crowdin

## Route

```txt
app/[lang]/keykit-vs-crowdin/page.tsx
```

## Namespace

```txt
pages.keykitVsCrowdin
```

## SEO

```txt
pages.keykitVsCrowdin.seo.metaTitle
Keykit vs Crowdin — Developer Localization Comparison

pages.keykitVsCrowdin.seo.metaDescription
Compare Keykit's automatic translation-key discovery and deprecation workflow with Crowdin's broad continuous-localization platform.
```

## Hero

```txt
pages.keykitVsCrowdin.hero.eyebrow
Keykit vs Crowdin

pages.keykitVsCrowdin.hero.title
Source-level key lifecycle vs broad continuous localization

pages.keykitVsCrowdin.hero.description
Crowdin offers a large localization platform with Git integrations, many supported formats, translation workflows, AI tooling and a broad integration ecosystem. Keykit is intentionally narrower and centers translation state around source-code usage.

pages.keykitVsCrowdin.hero.primaryCta
Try Keykit
```

## Shared goal

```txt
pages.keykitVsCrowdin.shared.title
Both products want localization to move with development

pages.keykitVsCrowdin.shared.description
Crowdin provides continuous localization through repository, CLI, API and integration workflows. Keykit approaches the same developer pain from a different direction: the translation calls inside the application define which keys are active.
```

## Workflow

```txt
pages.keykitVsCrowdin.workflow.title
Resource synchronization or direct key discovery

pages.keykitVsCrowdin.workflow.description
Many continuous-localization setups synchronize translation resources between the repository and localization platform. Keykit's core workflow can discover static keys directly from the application source.

pages.keykitVsCrowdin.workflow.note
Crowdin supports substantial automation around its workflow. The comparison is about architecture and product emphasis, not whether Crowdin can automate localization.
```

General continuous-localization path:

```txt
application
→ locale/source resources
→ repository/integration
→ localization platform
→ translated resources
→ application
```

Keykit:

```txt
application translate() calls
→ Keykit discovery
→ translation catalog
→ live/static delivery
```

## Cleanup

```txt
pages.keykitVsCrowdin.cleanup.title
Keykit makes disappearance from source a translation event

pages.keykitVsCrowdin.cleanup.description
When a feature is removed, Keykit can recognize that its translation key is no longer detected and mark it for deprecation.
```

Example:

```txt
documents.legacyUpload.title
documents.legacyUpload.description
documents.legacyUpload.actions.start

Feature removed
→ all three keys become deprecation candidates
```

## Keykit fit

```txt
pages.keykitVsCrowdin.fit.keykit.title
Keykit may fit better when

pages.keykitVsCrowdin.fit.keykit.items.app
You primarily localize your own application UI.

pages.keykitVsCrowdin.fit.keykit.items.react
React or Next.js development is central to the workflow.

pages.keykitVsCrowdin.fit.keykit.items.lifecycle
Automatic key discovery and deprecation are high-value problems.

pages.keykitVsCrowdin.fit.keykit.items.simple
You want a focused tool with minimal localization infrastructure.
```

## Crowdin fit

```txt
pages.keykitVsCrowdin.fit.competitor.title
Crowdin may fit better when

pages.keykitVsCrowdin.fit.competitor.items.formats
You need a very broad set of supported content and localization formats.

pages.keykitVsCrowdin.fit.competitor.items.community
Community or crowdsourced translation is important.

pages.keykitVsCrowdin.fit.competitor.items.integrations
You rely on a large integration ecosystem.

pages.keykitVsCrowdin.fit.competitor.items.operations
Your localization process spans software, documentation, marketing or other content types.
```

## FAQ

```txt
pages.keykitVsCrowdin.faq.title
Keykit vs Crowdin FAQ

pages.keykitVsCrowdin.faq.items.alternative.question
Is Keykit a Crowdin alternative?

pages.keykitVsCrowdin.faq.items.alternative.answer
For teams focused on application translation management, it can be. Crowdin covers a much broader localization surface, while Keykit focuses heavily on source-driven application keys and their lifecycle.

pages.keykitVsCrowdin.faq.items.migration.question
Can I move existing Crowdin translations to Keykit?

pages.keykitVsCrowdin.faq.items.migration.answer
The intended workflow is to import or map the existing translation data, then connect source discovery so Keykit can distinguish actively detected keys from legacy catalog entries.

pages.keykitVsCrowdin.faq.items.react.question
Which is better for React?

pages.keykitVsCrowdin.faq.items.react.answer
That depends on requirements. Keykit is specifically designed around a minimal developer workflow and source-level key lifecycle. Crowdin offers broader localization infrastructure and integrations.
```

## CTA

```txt
pages.keykitVsCrowdin.finalCta.title
Want the translation inventory to come from the application itself?

pages.keykitVsCrowdin.finalCta.description
Discover active keys directly from source and surface stale ones automatically.

pages.keykitVsCrowdin.finalCta.button
Try Keykit
```

---

# PAGE 10 — Keykit vs Tolgee

## Route

```txt
app/[lang]/keykit-vs-tolgee/page.tsx
```

## Namespace

```txt
pages.keykitVsTolgee
```

## SEO

```txt
pages.keykitVsTolgee.seo.metaTitle
Keykit vs Tolgee — Developer-First Localization Compared

pages.keykitVsTolgee.seo.metaDescription
Compare two developer-first localization approaches: Tolgee's SDK and in-context editing workflow vs Keykit's automatic source discovery and translation-key lifecycle.
```

## Hero

```txt
pages.keykitVsTolgee.hero.eyebrow
Keykit vs Tolgee

pages.keykitVsTolgee.hero.title
Two developer-first approaches to application localization

pages.keykitVsTolgee.hero.description
Tolgee and Keykit both aim to make localization less painful for software teams. The difference is emphasis: Tolgee has a strong SDK and in-context editing model, while Keykit centers its workflow on automatic source discovery and translation-key lifecycle.

pages.keykitVsTolgee.hero.primaryCta
Try Keykit
```

## Similarity

```txt
pages.keykitVsTolgee.similarity.title
This is not an old-school TMS vs developer tooling comparison

pages.keykitVsTolgee.similarity.description
Tolgee is already built for developers. Its SDK can provide runtime i18n functionality and connect applications to the Tolgee platform, while its in-context tooling lets users edit translations directly from the application.
```

## Keykit distinction

```txt
pages.keykitVsTolgee.difference.title
Keykit focuses on the lifecycle of the identifier itself

pages.keykitVsTolgee.difference.description
Keykit's central question is not only “what does this key translate to?” It is also “where is this key still being used, and what should happen when it disappears?”
```

Example:

```tsx
translate("dashboard.widgets.add")
```

```txt
detected
→ active
→ translated
→ removed from source
→ no longer detected
→ deprecated
→ reviewed
```

## In-context vs lifecycle

```txt
pages.keykitVsTolgee.context.title
In-context editing and source lifecycle solve different problems

pages.keykitVsTolgee.context.tolgee.title
Tolgee's in-context question

pages.keykitVsTolgee.context.tolgee.description
Where in the interface is this text, and how can someone edit the translation directly from the application?

pages.keykitVsTolgee.context.keykit.title
Keykit's lifecycle question

pages.keykitVsTolgee.context.keykit.description
Which source still references this translation key, and is it becoming safe to deprecate or remove?

pages.keykitVsTolgee.context.conclusion
A team may care much more about one of these workflows depending on who owns localization and where the current pain is.
```

## Keykit fit

```txt
pages.keykitVsTolgee.fit.keykit.title
Keykit may fit better when

pages.keykitVsTolgee.fit.keykit.items.discovery
Automatic source-key discovery is a core requirement.

pages.keykitVsTolgee.fit.keykit.items.deprecation
Stale translations and safe key deprecation are recurring problems.

pages.keykitVsTolgee.fit.keykit.items.delivery
You specifically want Keykit's live/static delivery model.

pages.keykitVsTolgee.fit.keykit.items.workflow
You want a translation workflow built around source usage rather than in-context editing.
```

## Tolgee fit

```txt
pages.keykitVsTolgee.fit.competitor.title
Tolgee may fit better when

pages.keykitVsTolgee.fit.competitor.items.context
In-context translation and direct UI editing are central requirements.

pages.keykitVsTolgee.fit.competitor.items.selfHosted
Self-hosting or an open-source localization stack is important.

pages.keykitVsTolgee.fit.competitor.items.runtime
You specifically want Tolgee's runtime i18n SDK functionality.

pages.keykitVsTolgee.fit.competitor.items.screenshots
One-click screenshots and visual translation context are especially valuable to your workflow.
```

## Honest tradeoff

```txt
pages.keykitVsTolgee.tradeoff.title
Choose around the workflow you actually want

pages.keykitVsTolgee.tradeoff.description
Keykit should not try to win this comparison by pretending every localization feature is equivalent. Tolgee has meaningful strengths in open-source/self-hosted localization and in-context editing. Keykit's reason to exist is a different one: make translation-key state follow source-code state automatically.
```

## FAQ

```txt
pages.keykitVsTolgee.faq.title
Keykit vs Tolgee FAQ

pages.keykitVsTolgee.faq.items.alternative.question
Is Keykit a Tolgee alternative?

pages.keykitVsTolgee.faq.items.alternative.answer
Yes for teams evaluating developer-focused application localization, but the products emphasize different workflows.

pages.keykitVsTolgee.faq.items.mainDifference.question
What is the biggest difference?

pages.keykitVsTolgee.faq.items.mainDifference.answer
Tolgee strongly emphasizes runtime SDK integration and in-context translation. Keykit strongly emphasizes automatic source-key discovery, lifecycle state and deprecation when source usage disappears.

pages.keykitVsTolgee.faq.items.selfHosted.question
Can Keykit be self-hosted?

pages.keykitVsTolgee.faq.items.selfHosted.answer
Use the current Keykit deployment model when implementing this answer. If Keykit remains cloud-only, say so directly rather than weakening the comparison with vague wording.
```

## CTA

```txt
pages.keykitVsTolgee.finalCta.title
If stale keys are the problem, start from source usage

pages.keykitVsTolgee.finalCta.description
Let Keykit discover when translation keys appear and when they stop being part of the application.

pages.keykitVsTolgee.finalCta.button
Try Keykit
```

---

# Internal linking map

```txt
/translation-management
→ /how-it-works
→ /automatic-translation-key-discovery
→ /react-translations
→ /nextjs-translations
→ /translation-key-lifecycle

/how-it-works
→ /automatic-translation-key-discovery
→ /translation-key-lifecycle
→ /react-translations
→ /nextjs-translations

/automatic-translation-key-discovery
→ /how-it-works
→ /translation-key-lifecycle
→ /react-translations
→ /nextjs-translations

/translation-key-lifecycle
→ /automatic-translation-key-discovery
→ /how-it-works
→ /translation-management

/react-translations
→ /how-it-works
→ /automatic-translation-key-discovery
→ /nextjs-translations

/nextjs-translations
→ /react-translations
→ /automatic-translation-key-discovery
→ /how-it-works

/keykit-vs-lokalise
/keykit-vs-phrase
/keykit-vs-crowdin
/keykit-vs-tolgee
→ /how-it-works
→ /automatic-translation-key-discovery
→ /translation-key-lifecycle
```

---

# Recommended build order

```txt
1. /how-it-works
2. /translation-management
3. /automatic-translation-key-discovery
4. /translation-key-lifecycle
5. /react-translations
6. /nextjs-translations
7. /keykit-vs-lokalise
8. /keykit-vs-tolgee
9. /keykit-vs-crowdin
10. /keykit-vs-phrase
```

---

# Cursor implementation checklist

1. Create manual routes under `app/[lang]/...`.
2. Do not create or use a CMS.
3. Do not hard-code visible copy.
4. Convert every source string above into `translate("pages.<page>....")`.
5. Use `common.*` only for genuinely shared UI strings.
6. Keep page namespaces camelCase.
7. Use the real Keykit SDK APIs from the repository for code examples.
8. Preserve `delivery: "live"` and `delivery: "static"`.
9. For static delivery, mention/use the Keykit CLI pull workflow.
10. Add localized metadata.
11. Add canonical URLs and locale alternates.
12. Use semantic heading structure.
13. Add contextual internal links from the map above.
14. Add FAQ structured data only when the rendered FAQ is present.
15. Do not add competitor claims that are not verified against current official documentation.
16. Do not mention feature flags anywhere on these pages.
