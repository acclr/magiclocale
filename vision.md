# Keykit — Product & Feature Specification

## 1. Product vision

Keykit is a developer-first platform for managing two closely related kinds of application configuration:

- localization keys
- feature flags

Both are effectively **named keys referenced throughout source code**, and both tend to become difficult to maintain as applications grow.

Teams commonly end up with:

```text
translations
├── common.save
├── billing.invoice.title
├── project.projectName
├── old.settings.submit
└── randomButtonLabel

feature flags
├── new-dashboard
├── EnableNewDashboard
├── dashboardV2
├── test-feature
└── temporary_fix_123
```

Over time:

- naming conventions drift
- duplicate keys appear
- obsolete keys remain
- ownership becomes unclear
- namespaces become inconsistent
- developers stop knowing what can safely be removed
- temporary feature flags become permanent
- translation structures become increasingly difficult to refactor

Keykit should solve this by understanding **where keys exist in source code, how they are used, what they represent, and how they should evolve**.

The long-term vision is:

> Keykit is the key architecture platform for your application.

It should answer questions such as:

```text
Where is this translation used?

Can I safely delete this feature flag?

Why do we have three flags for the same feature?

Should these translations live under common.*?

Which flags are stale?

Which flags exist in production but not staging?

What keys belong to the billing feature?

What should our namespace structure look like?

What source code needs changing if I rename this key?
```

Keykit should cover five main responsibilities:

1. **Discover**
   - Automatically detect translation and feature-flag usages in source code.

2. **Manage**
   - Manage translations, locales, flags, environments and configuration.

3. **Synchronize**
   - Keep application source code and Keykit synchronized.

4. **Migrate**
   - Import existing translation and feature-flag systems.

5. **Improve**
   - Help teams structure, clean up and refactor both translations and flags.

---

# 2. Core platform concept

The central concept in Keykit is the **Key**.

A key can represent different types of application configuration.

Initial key types:

```text
Translation
Feature Flag
```

Potential future key types could include:

```text
Remote Config
Experiment
Permission
Setting
```

But translations and feature flags should remain the initial focus.

Conceptually:

```text
Keykit Project
│
├── Translation Keys
│   ├── common.save
│   ├── billing.invoice.title
│   └── projects.create.submit
│
└── Feature Flags
    ├── billing.newCheckout
    ├── dashboard.redesign
    └── projects.bulkDelete
```

Both key types share:

- key name
- namespace
- description
- ownership
- source-code usages
- creation date
- last detected date
- lifecycle status
- tags
- history
- architecture findings

They then have type-specific configuration.

The product and npm package name is Keykit (`@keykit/sdk`).

---

# 3. Project

A Keykit project represents one application, product or configuration domain.

A project can contain:

```text
Project
├── Environments
├── Translation locales
├── Translation keys
├── Feature flags
├── Source usages
├── Architecture rules
├── Imports
├── Migrations
├── Activity
└── Integrations
```

Example:

```text
Acme SaaS

Environments
├── Development
├── Staging
└── Production

Locales
├── en
├── sv
├── de
└── fr
```

---

# 4. Source-code integration

## 4.1 Automatic key detection

Keykit provides an npm package/SDK that scans the application's source code.

Translation example:

```ts
t('billing.invoice.download');
```

Feature flag example:

```ts
flags.isEnabled('billing.newCheckout');
```

or:

```tsx
<FeatureFlag flag="dashboard.redesign">
  <NewDashboard />
</FeatureFlag>
```

Keykit detects these usages automatically.

---

# 5. Source metadata

For every detected key usage, Keykit should store information such as:

```ts
{
  key: "billing.newCheckout",
  type: "featureFlag",
  file: "src/features/billing/Checkout.tsx",
  line: 42,
  column: 18,
  repository: "acme/frontend",
  branch: "main"
}
```

The same should apply to translations.

Example:

```ts
{
  key: "billing.invoice.download",
  type: "translation",
  file: "src/features/billing/InvoiceActions.tsx",
  line: 28
}
```

This source information is fundamental to Keykit.

It enables:

- usage inspection
- dead-key detection
- architecture analysis
- safe renaming
- source-code refactoring
- ownership inference
- feature grouping

---

# 6. Key lifecycle

Keys should have lifecycle states.

Shared lifecycle concepts:

```text
Active
Unused
Deprecated
Archived
```

---

## Active

Currently detected in source code.

---

## Unused

Previously detected but currently has no detected usages.

Example:

```text
dashboard.oldLayout

Usage count:
0

Last detected:
2026-08-12
```

This is particularly important for feature flags.

An unused feature flag may indicate that:

- the feature has been fully rolled out
- the fallback code has been removed
- the flag can potentially be deleted

---

## Deprecated

Still supported temporarily but should no longer be used.

Example:

```text
Old key:

dashboardV2

Replacement:

dashboard.redesign
```

---

## Archived

Kept for historical purposes but no longer considered active project configuration.

---

# 7. Translation management

Keykit should provide complete translation management.

Core concepts:

```text
Translation Key
Source Locale
Translations
Locales
Context
Source Usages
History
Status
```

Example:

```text
billing.invoice.download

English
Download invoice

Swedish
Ladda ner faktura

German
Rechnung herunterladen
```

---

# 8. Translation Explorer

The Translation Explorer is the main interface for localization content.

Users must be able to search across:

- translation key
- source-language text
- translated values
- namespace
- description
- source files
- tags
- ownership

Example search:

```text
Delete account
```

could return:

```text
settings.account.delete
profile.deleteAccount
common.deleteAccount
```

even if the keys themselves do not contain the searched phrase.

---

# 9. Translation search syntax

Eventually support advanced search.

Examples:

```text
namespace:billing

locale:de

status:missing

source:"Delete account"

usage:0

file:Invoice

owner:billing-team
```

Combined:

```text
namespace:billing locale:de status:missing
```

---

# 10. Translation filters

Useful filters include:

- namespace
- locale
- translation status
- missing translation
- machine translated
- manually translated
- reviewed
- recently added
- recently changed
- unused
- deprecated
- duplicate source text
- key usage count
- feature
- owner
- source directory

---

# 11. Translation detail view

Each translation key should have its own detail page.

Example:

```text
billing.invoice.download
```

### Source

```text
Download invoice
```

### Translations

```text
English
Download invoice

Swedish
Ladda ner faktura

German
Rechnung herunterladen
```

### Usage

```text
src/features/billing/InvoiceActions.tsx:42
src/features/billing/InvoiceMenu.tsx:28
```

### Metadata

```text
Namespace:
billing.invoice

Owner:
Billing

Created:
2026-09-12

Last detected:
2026-09-18

Usage count:
2
```

---

# 12. Translation states

Each locale value should have a status.

Suggested states:

```text
Missing
Machine translated
Needs review
Reviewed
Approved
Outdated
```

If the source text changes:

```text
Delete
```

to:

```text
Delete account
```

existing translations should potentially become:

```text
Outdated
```

instead of remaining silently approved.

---

# 13. Translation context

Translations should support contextual information.

Possible metadata:

```text
Description
Developer note
Translator note
Feature
Component
Screenshot
Character limit
Variables
Pluralization
```

Example:

```text
billing.invoice.sent

Source:
Invoice sent to {{email}}

Variables:
email: string
```

---

# 14. Translation variable validation

Keykit should validate interpolation variables.

Source:

```text
Hello {{name}}
```

Incorrect translation:

```text
Hej
```

Keykit should report:

```text
Missing variable:

{{name}}
```

Likewise:

```text
Hello {{name}}
```

should not accidentally become:

```text
Hej {{username}}
```

---

# 15. Translation history

Every translation should have revision history.

Example:

```text
18 Sep 2026

Changed:

"Remove account"

to:

"Delete account"
```

Users should be able to inspect and restore previous values.

---

# 16. Feature Flags

Feature flags should be a first-class part of Keykit rather than a separate product.

A feature flag represents a piece of application behavior that can be enabled, disabled or configured independently from deployment.

Example:

```text
dashboard.redesign
```

Usage:

```ts
if (flags.isEnabled("dashboard.redesign")) {
  return <NewDashboard />;
}
```

Keykit should track:

```text
Key
Description
Namespace
Environment values
Source usages
Owner
Lifecycle
Created date
Last changed
Last detected
Tags
Dependencies
History
```

---

# 17. Feature flag types

Initial flag types should stay relatively simple.

## Boolean

```text
true / false
```

Example:

```text
dashboard.redesign = true
```

---

## String

Potential later support:

```text
billing.checkoutVersion = "v2"
```

---

## Number

Potential later support:

```text
search.maxResults = 100
```

---

## JSON / Remote configuration

Potential later support:

```json
{
  "layout": "compact",
  "limit": 50
}
```

The initial product can focus primarily on boolean flags.

---

# 18. Environments

Feature flags must support environments.

Typical project:

```text
Development
Staging
Production
```

A flag exists once in the project but has different values in each environment.

Example:

```text
dashboard.redesign

Development
ON

Staging
ON

Production
OFF
```

The key itself is shared.

The environment values differ.

This is preferable to creating separate keys such as:

```text
dev.dashboard.redesign
staging.dashboard.redesign
prod.dashboard.redesign
```

Serving remains independent: each environment publishes its own snapshot. Linked environments inherit or override **working-copy** values; live apps still read the published version for that environment.

---

# 19. Linked environments

Keykit should introduce the concept of **linked environments**.

Environments often follow a progression:

```text
Development
    ↓
Staging
    ↓
Production
```

Keykit should understand these relationships.

Example configuration:

```text
Development
Parent: none

Staging
Parent: Development

Production
Parent: Staging
```

This creates an environment chain.

---

# 20. Environment inheritance

A linked environment may inherit values from another environment.

Example:

```text
dashboard.redesign
```

Development:

```text
ON
```

Staging:

```text
Inherited from Development
```

Production:

```text
OFF
```

Conceptually:

```text
Development
ON
  │
  ▼
Staging
ON [inherited]
  │
  ▼
Production
OFF [override]
```

This reduces duplicate configuration.

---

# 21. Explicit overrides

Keykit must clearly distinguish:

```text
Inherited value
```

from:

```text
Explicit override
```

Example:

```text
Flag:
dashboard.redesign

Development
ON

Staging
ON
Inherited from Development

Production
OFF
Override
```

The UI should make this visually obvious.

---

# 22. Environment promotion

Linked environments enable a useful workflow:

```text
Development
→ Staging
→ Production
```

A developer may enable:

```text
billing.newCheckout
```

in Development first.

After testing, they can promote the value to Staging.

Later:

```text
Promote to Production
```

Potential workflow:

```text
Development
ON

↓ Promote

Staging
ON

↓ Promote

Production
ON
```

Promotion should be explicit and auditable.

---

# 23. Environment comparison

Users should be able to compare environments.

Example:

```text
Compare:

Staging
vs
Production
```

Result:

```text
18 differences

dashboard.redesign
Staging: ON
Production: OFF

billing.newCheckout
Staging: ON
Production: OFF

projects.bulkDelete
Staging: OFF
Production: ON
```

This can reveal configuration drift.

---

# 24. Environment groups

Larger projects may later support groups such as:

```text
Local
Development
QA
Preview
Staging
Production EU
Production US
```

Potential structure:

```text
Development
    │
    ├── Preview
    │
    └── QA
         │
         ▼
      Staging
         │
    ┌────┴─────┐
    ▼          ▼
Prod EU     Prod US
```

Keykit should therefore avoid assuming that environments must form only one linear chain.

The underlying model should support a graph/tree relationship.

---

# 25. Feature flag targeting

Initially, environment-level values may be sufficient.

Later, Keykit could support targeting.

Example:

```text
Production

Default:
OFF

Rules:
user.email endsWith "@keykit.dev"
→ ON

organizationId == "abc"
→ ON
```

Potential targeting dimensions:

```text
User
Organization
Country
Percentage rollout
Custom attributes
```

This should be considered a later feature rather than required for the first flag implementation.

---

# 26. Percentage rollout

Later:

```text
dashboard.redesign

Production rollout:
25%
```

Then:

```text
25%
↓
50%
↓
100%
```

Once the feature reaches 100%, Keykit can help identify whether the flag should now be removed.

---

# 27. Feature flag lifecycle

Feature flags need stronger lifecycle management than translation keys.

Suggested states:

```text
Draft
Active
Fully Rolled Out
Deprecated
Stale
Archived
```

---

## Draft

Created but not yet actively used.

---

## Active

Used in source code and controlling application behavior.

---

## Fully Rolled Out

Enabled for all relevant production users.

This should trigger a potential cleanup suggestion.

Example:

```text
dashboard.redesign

Production:
100% enabled

Duration:
47 days

Suggestion:

This flag may no longer be necessary.
```

---

## Deprecated

No new source usages should be introduced.

---

## Stale

Potentially obsolete.

Example criteria:

```text
Created 280 days ago
Production ON for 190 days
Fallback branch still exists
No recent changes
```

---

## Archived

Removed from active configuration but retained historically.

---

# 28. Feature flag stale detection

Feature flags are notorious for accumulating.

Keykit should actively detect stale flags.

Examples:

### Permanently enabled

```text
billing.newCheckout

Production:
ON for 164 days

Potential cleanup:
Remove flag and old checkout implementation.
```

### Permanently disabled

```text
projects.experimentalGrid

Production:
OFF for 210 days

Potential cleanup:
Remove experimental implementation and flag.
```

### No source usages

```text
dashboard.oldDashboard

Usages:
0

Potential cleanup:
Delete flag.
```

### Unknown flag

Used in source but missing remotely.

```text
flags.isEnabled("billing.newPricing")
```

but no Keykit definition exists.

---

# 29. Feature flag detail page

Example:

```text
billing.newCheckout
```

### Description

```text
Enables the redesigned checkout flow.
```

### Environments

```text
Development
ON

Staging
ON

Production
OFF
```

### Source usages

```text
src/features/billing/CheckoutPage.tsx:28
src/features/billing/CheckoutRouter.tsx:61
```

### Metadata

```text
Owner:
Billing Team

Created:
2026-08-14

Last changed:
2026-09-18

Usage count:
2
```

### Architecture

```text
Status:
Healthy
```

or:

```text
Finding:
Naming does not match project convention.
```

---

# 30. Feature flag history

All changes should be recorded.

Example:

```text
18 Sep 2026

Kim changed:

Production
OFF → ON
```

or:

```text
16 Sep 2026

Anna promoted value:

Development → Staging
```

---

# 31. Flag safety

Production flag changes should be treated carefully.

Potential protections:

```text
Require confirmation

Require reason

Require reviewer

Prevent translator role from changing flags

Restrict production environment

Audit every change
```

Advanced approval workflows can come later.

---

# 32. Unified Key Explorer

Keykit should have a unified view of application keys.

Example:

```text
Keys

Type           Key
-----------------------------------------
Translation    common.save
Translation    billing.invoice.download
Feature Flag   billing.newCheckout
Feature Flag   dashboard.redesign
```

Search:

```text
billing
```

should return both translation and feature-flag keys.

Users can filter:

```text
type:translation

type:flag

namespace:billing

usage:0

owner:billing
```

---

# 33. Keykit architecture system

A major differentiator should be that Keykit helps teams structure **both translations and feature flags**.

Most teams have conventions buried in:

```text
README files
Confluence pages
tribal knowledge
code review comments
```

Keykit should turn these conventions into explicit, analyzable project architecture.

---

# 34. Shared architecture model

Both translation keys and feature flags can follow the same broad structure.

For example:

```text
<domain>.<feature>.<purpose>
```

Translations:

```text
billing.invoice.download

projects.create.submit
```

Flags:

```text
billing.checkout.redesign

projects.bulkDelete.enabled
```

Keykit should understand relationships between keys.

Example:

```text
billing
├── translations
│   ├── billing.invoice.title
│   ├── billing.invoice.download
│   └── billing.checkout.submit
│
└── flags
    ├── billing.checkout.redesign
    └── billing.invoice.newPreview
```

This makes the feature/domain visible across configuration types.

---

# 35. Feature grouping

Keykit should allow keys to belong to a logical product feature.

Example:

```text
Feature:
Billing / Checkout
```

Contains:

```text
Translations

billing.checkout.title
billing.checkout.submit
billing.checkout.error

Feature Flags

billing.checkout.redesign
billing.checkout.applePay
```

This is useful because the application's conceptual architecture often matters more than whether something happens to be a translation or feature flag.

---

# 36. Architecture explorer

Keykit should offer an architecture-oriented view.

Example:

```text
Billing

├── Checkout
│   │
│   ├── Translations
│   │   ├── billing.checkout.title
│   │   ├── billing.checkout.submit
│   │   └── billing.checkout.error
│   │
│   └── Feature Flags
│       ├── billing.checkout.redesign
│       └── billing.checkout.applePay
│
└── Invoice
    │
    ├── Translations
    │   ├── billing.invoice.title
    │   └── billing.invoice.download
    │
    └── Feature Flags
        └── billing.invoice.newPreview
```

This can become one of Keykit's strongest views.

---

# 37. Architecture rules

Projects should be able to define conventions.

Example:

```text
Namespaces

Top-level namespaces must represent domains.

Allowed domains:

billing
projects
users
settings
common
```

Rules may differ by key type.

---

# 38. Translation architecture rules

Example:

```text
Shared actions:
common.*

Feature-specific translations:
<domain>.<feature>.*

Maximum depth:
4

Naming:
camelCase
```

---

# 39. Feature flag architecture rules

Example:

```text
Feature flags must begin with a domain.

Allowed:

billing.checkout.redesign
projects.bulkDelete

Avoid:

newCheckout
testFlag
enableStuff
```

Potential rules:

```text
Maximum namespace depth

Minimum namespace depth

Required owner

Required description

Required expiry/review date

Allowed naming format

Forbidden prefixes

Required feature association
```

---

# 40. Temporary flag policy

Keykit should allow teams to define rules for temporary flags.

Example:

```text
Temporary flags require:

Owner
Created date
Review date
Description
```

Example flag:

```text
billing.checkout.redesign

Owner:
Billing

Created:
2026-09-01

Review:
2026-10-15
```

When the review date passes:

```text
Architecture finding:

This temporary flag is overdue for review.
```

---

# 41. Architecture analysis

Keykit should analyze the entire key system.

Potential findings include:

```text
Duplicate translations

Duplicate flags

Inconsistent namespaces

Unused keys

Stale flags

Missing ownership

Missing descriptions

Poorly named flags

Feature/common translation confusion

Keys placed in the wrong domain

Overly deep namespaces

Ambiguous keys
```

---

# 42. Duplicate translation detection

Example:

```text
common.save = "Save"

billing.save = "Save"

settings.save = "Save"
```

Suggestion:

```text
Potential shared translation

Suggested:
common.save
```

---

# 43. Duplicate feature flag detection

Example:

```text
dashboardV2

dashboard.redesign

newDashboard
```

If all three are used around the same feature, Keykit could report:

```text
Potential overlapping feature flags.
```

It should not automatically assume they are duplicates.

Instead:

```text
Review usages
Compare environments
Merge
Ignore
Mark intentional
```

---

# 44. Namespace inconsistency detection

Example:

```text
billing.invoice.download

invoice.preview

payments.invoice.send

billing.invoices.delete
```

Keykit could suggest:

```text
These keys appear related to Billing / Invoice.

Suggested namespace:

billing.invoice.*
```

This could apply to both translations and flags.

---

# 45. Cross-type architecture findings

This is an important Keykit-specific capability.

Example:

Source structure:

```text
src/features/billing/checkout/
```

Translations:

```text
payments.checkout.title
checkout.submit
billing.pay.error
```

Flags:

```text
newCheckout
billingV2
```

Keykit understands that these are all used inside:

```text
features/billing/checkout
```

and can suggest:

```text
Suggested architecture:

billing.checkout.*

Translations:
billing.checkout.title
billing.checkout.submit
billing.checkout.error

Flags:
billing.checkout.redesign
billing.checkout.v2
```

This is much more powerful than analyzing translations and flags independently.

---

# 46. Architecture health dashboard

Example:

```text
Key Architecture

Total keys
3,142

Translations
2,481

Feature flags
661
```

Findings:

```text
Unused translations
84

Stale flags
23

Potential duplicate translations
42

Potential overlapping flags
8

Namespace issues
61

Missing owners
17

Naming issues
38
```

The important part should be actionable findings rather than an arbitrary score.

---

# 47. Architecture findings

Each issue should be represented as an individual finding.

Example:

```text
Potential stale feature flag

dashboard.redesign

Production has been ON for 143 days.

Fallback code still exists.

Source usages:
4
```

Actions:

```text
Review
Ignore
Create cleanup migration
Mark intentional
```

---

# 48. Translation architecture findings

Example:

```text
Potential shared translation

billing.save
projects.save
settings.save

All contain:
"Save"

Suggested:
common.save
```

---

# 49. Feature flag architecture findings

Example:

```text
Poorly scoped feature flag

newTable

Detected in:

src/features/projects/table/
```

Suggested:

```text
projects.table.redesign
```

---

# 50. Architecture assistant

Keykit should eventually provide an AI-assisted architecture system.

Users could ask:

```text
Analyze our key architecture.
```

Keykit could respond:

```text
I analyzed:

2,481 translations
661 feature flags
4,812 source references

I found:

84 unused translations
23 stale feature flags
41 namespace inconsistencies
32 potential shared translations
8 potentially overlapping feature flags
```

It should then offer structured suggestions.

---

# 51. Feature-focused architecture assistant

A developer could ask:

```text
Clean up our checkout keys.
```

Keykit could identify:

```text
Feature:
Billing / Checkout

Translations:
47

Feature flags:
6

Namespaces currently used:
billing.checkout.*
checkout.*
payments.checkout.*
newCheckout.*
```

Then propose:

```text
billing.checkout.*
```

as the consolidated structure.

---

# 52. Architecture migrations

Keykit should represent significant structural changes as explicit **migrations**.

A migration may contain changes to both translations and feature flags.

Example:

```text
Migration

Billing Checkout Cleanup
```

Changes:

```text
Translations renamed:
18

Translation merges:
4

Feature flags renamed:
3

Unused translations removed:
7

Stale feature flags removed:
2
```

---

# 53. Migration operations

A migration can contain operations such as:

```text
Rename key

Move key

Merge translations

Deprecate key

Archive key

Delete key

Rename feature flag

Remove stale flag

Move key to namespace

Assign owner
```

---

# 54. Example cross-type migration

Current structure:

```text
Translations

checkout.title
payment.submit
billing.checkoutError

Flags

newCheckout
checkoutV2
```

Migration proposes:

```text
Translations

billing.checkout.title
billing.checkout.submit
billing.checkout.error

Flags

billing.checkout.redesign
billing.checkout.v2
```

This gives teams one controlled cleanup process.

---

# 55. Refactor engine

Keykit should eventually be able to apply architecture migrations back into source code.

Translation:

```ts
t('billing.save');
```

becomes:

```ts
t('common.save');
```

Feature flag:

```ts
flags.isEnabled('newCheckout');
```

becomes:

```ts
flags.isEnabled('billing.checkout.redesign');
```

---

# 56. Source modification architecture

The Keykit backend should not directly modify developer filesystems.

Refactoring should happen locally.

Suggested flow:

```text
Keykit Web App
       │
       ▼
Create migration
       │
       ▼
Local CLI applies source rewrites
       │
       ▼
Upload completion
```
