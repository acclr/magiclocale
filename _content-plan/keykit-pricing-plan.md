# Keykit Pricing Plan

## Positioning

Keykit should use a pricing model that reflects how the product actually creates value:

> **Pay for what your product uses. Not how many people work on it.**

The primary pricing unit should be **active translation keys**, not seats, languages, total stored words, deprecated keys, or archived keys.

Meter the few areas that have real infrastructure or AI cost:

- Active keys
- Live delivery
- AI translation
- Connected source applications

This keeps pricing predictable, developer-friendly, and aligned with Keykit's automatic discovery and deprecation model.

---

# Core billing principle

## Active keys are billable

An **active key** is a translation key currently detected in one or more connected application sources.

Example:

```txt
projects.create.title
projects.actions.save
billing.subscription.cancel
```

If those keys are currently detected by source discovery, they count toward the active-key allowance.

## Deprecated keys are free

If a key disappears from all relevant connected sources and becomes `No longer detected` or `Deprecated`, it should stop counting toward the customer's active-key allowance.

Archived keys should also be free.

Suggested pricing-page tooltip:

> **What is an active key?**  
> A translation key currently detected in one or more connected sources. Deprecated and archived keys never count toward your bill.

---

# Plans

Keykit should initially offer three plans:

```txt
Free
Pro
Enterprise
```

---

# Free

## Price

```txt
$0 / month
```

## Positioning

> For side projects, prototypes and trying Keykit with a real application.

The Free tier should expose the features that explain why Keykit is different.

Do not hide automatic discovery or automatic deprecation behind a paid plan.

## Included capacity

```txt
500 active translation keys
3 languages
1 project
1 connected source/application
2 team members
100,000 live-delivery requests / month
1 GB live-delivery bandwidth / month
5,000 AI-translated words / month
```

## Included features

### Translation management

- automatic translation-key discovery
- automatic no-longer-detected tagging
- automatic deprecation workflow
- translation editor
- source-text search
- key search
- missing-translation visibility
- basic namespace organization
- import existing translations
- export translations

### Developer tooling

- React integration
- Next.js integration
- plain JavaScript / TypeScript support
- CLI
- static translation delivery
- Keykit CLI pull
- limited live delivery

### Translation workflow

- AI-assisted translation
- basic translation status
- basic source usage information
- 30-day translation history

### Support

- documentation
- community support
- standard email support where practical

## Free-tier limits

The Free tier should be limited primarily by genuine product size:

```txt
Active keys
Languages
Projects
Sources
Live delivery
AI usage
```

Avoid artificial restrictions such as:

```txt
Only 10 discovery scans
No automatic deprecation
No React SDK
No CLI
No imports
```

Those restrictions would make it harder for developers to understand the product's value.

## What happens when the Free plan exceeds 500 active keys?

Do not break production.

Do not delete translations.

Do not disable existing translation delivery immediately.

Suggested behavior:

> Your project has exceeded the Free active-key allowance. Existing translations continue working, but new keys will not be automatically translated until you upgrade or reduce active usage.

Provide warnings before enforcement:

```txt
80% usage
90% usage
100% usage
```

---

# Pro

## Price

```txt
$29 / month
```

## Positioning

> Everything a software team needs to manage application translations.

This should be the default recommended plan.

## Included capacity

```txt
3,000 active translation keys
Unlimited languages
Unlimited projects
Unlimited team members
5 connected source applications
1,000,000 live-delivery requests / month
10 GB live-delivery bandwidth / month
25,000 AI-translated words / month
```

## Included translation features

- automatic translation-key discovery
- automatic no-longer-detected tagging
- automatic deprecation workflow
- source usage tracking
- translation editor
- search by translation key
- search by source text
- missing-translation visibility
- namespace organization
- translation status
- translation history
- import/export
- comments
- review workflow
- glossary when implemented
- translation memory when implemented
- AI-assisted translations
- project-specific AI context/instructions

## Included developer features

- React SDK
- Next.js client support
- Next.js server support
- JavaScript / TypeScript support
- Keykit CLI
- API access
- webhooks
- static delivery
- live delivery
- source-level discovery
- usage by connected source
- multiple source applications per project
- source-aware deprecation

## Included collaboration

```txt
Unlimited team members
Unlimited translators
Unlimited reviewers
```

Keykit should not charge a seat tax on Pro.

Suggested pricing copy:

> **No seat tax. Invite your whole team.**

---

# Pro usage pricing

Pro should include meaningful capacity and then expand through transparent usage blocks.

Do not create dozens of individual billing dimensions.

Use only a few understandable units.

## 1. Active translation keys

Included:

```txt
3,000 active keys
```

Additional usage:

```txt
+$4 / additional 1,000 active keys / month
```

| Active keys | Monthly platform price |
|---:|---:|
| Up to 3,000 | $29 |
| 4,000 | $33 |
| 5,000 | $37 |
| 10,000 | $57 |
| 20,000 | $97 |

Deprecated and archived keys do not count.

## 2. Live delivery

Static-delivery customers should not pay runtime-delivery fees.

Pro includes:

```txt
1,000,000 live requests / month
10 GB bandwidth / month
```

Additional usage:

```txt
+$3 / additional 1,000,000 requests
+$2 / additional 10 GB bandwidth
```

Example:

```txt
delivery: "static"
```

No live-delivery usage fee.

Example:

```txt
delivery: "live"
```

Usage is billed only when included capacity is exceeded.

## 3. AI translation

AI translation is a real variable infrastructure expense.

Pro includes:

```txt
25,000 AI-translated words / month
```

Initial suggested structure:

```txt
+$1 / additional 25,000 translated words
```

Do not finalize this rate until production model costs are measured.

Target gross margin:

```txt
3x–5x blended AI cost
```

The public price should account for:

- token usage
- source language
- target language
- contextual prompts
- retries
- model choice
- glossary/context overhead

## Bring Your Own AI Key

Pro should support BYOK if technically practical.

Potential providers:

```txt
OpenAI
Anthropic
Google Gemini
```

Suggested pricing:

```txt
$0 Keykit AI surcharge
```

Suggested marketing message:

> **Bring your own AI key. We don't tax it.**

## 4. Connected source applications

A connected source may represent:

```txt
web
admin-web
backend
mobile
worker
```

Pro includes:

```txt
5 connected sources
```

Additional sources:

```txt
+$3 / source / month
```

Keep this inexpensive so customers are encouraged to connect every relevant application.

---

# Pro example bills

## Example 1 — Indie SaaS

```txt
1,400 active keys
6 languages
3 developers
1 Next.js application
Static delivery
12,000 AI-translated words
```

Monthly price:

```txt
$29
```

## Example 2 — Growing SaaS

```txt
6,800 active keys
12 languages
14 team members
3 connected sources
1.8M live requests
```

Estimate:

```txt
Pro base                       $29
4 × additional 1k keys        $16
1M additional live requests    $3
---------------------------------
Estimated total               $48 / month
```

## Example 3 — Larger product

```txt
18,000 active keys
25 languages
40 team members
5 connected sources
6M live requests
```

Estimate:

```txt
Pro base                       $29
15 × additional 1k keys       $60
5M additional live requests   $15
---------------------------------
Estimated total              $104 / month
```

Plus any AI usage beyond the included allowance.

---

# Enterprise

## Starting price

```txt
From $299 / month
```

Enterprise should not simply mean:

> Pro with more keys.

Enterprise customers primarily pay for:

```txt
Governance
Security
Procurement
Reliability
Support
Volume
Risk reduction
```

## Included capacity

Suggested starting point:

```txt
25,000 active keys
Unlimited languages
Unlimited team members
Unlimited projects
Unlimited connected sources
High-volume live delivery
Custom AI allowance
```

Higher-volume contracts can use:

```txt
50k active keys
100k active keys
250k active keys
Custom
```

## Enterprise translation features

Everything in Pro, plus:

- organization-wide translation search
- organization-wide usage insights
- cross-project deprecation insights
- shared glossary
- shared translation memory
- protected translations
- approval workflows
- organization-level localization rules
- organization-level namespace conventions
- advanced translation history
- long-term audit history
- branching when implemented
- custom retention rules

## Enterprise security

- SAML SSO
- SCIM provisioning
- enforced 2FA
- granular roles
- organization-level permissions
- project-level permissions
- API-token policies
- audit logs
- custom data retention
- DPA
- security documentation
- EU data residency when supported
- custom security requirements where practical

## Enterprise support

- priority support
- migration assistance
- onboarding assistance
- architecture review
- integration support
- SLA
- named technical contact
- dedicated Slack / Teams channel at appropriate contract size
- scheduled success reviews where useful

## Enterprise procurement

Support:

- annual contracts
- annual invoicing
- purchase orders
- custom contracts
- DPA
- vendor-security questionnaires
- invoicing in agreed currency where practical
- negotiated payment terms

## Enterprise usage pricing

### Option A — committed annual capacity

Example:

```txt
50,000 active keys
50M live requests / month
Custom AI allowance
Annual contract
```

Customer receives a lower effective usage price in exchange for commitment.

### Option B — metered usage with spend cap

Example:

```txt
Enterprise base
+
metered active keys
+
metered delivery
+
AI usage
```

But with:

```txt
contractual monthly or annual maximum
```

This prevents unpredictable enterprise invoices.

---

# Recommended public pricing matrix

| Feature | Free | Pro | Enterprise |
|---|:---:|:---:|:---:|
| Price | $0 | **$29/mo** | **From $299/mo** |
| Active keys | 500 | 3,000 included | 25,000+ |
| Extra active keys | — | $4 / 1k | Volume pricing |
| Deprecated keys | Free | Free | Free |
| Archived keys | Free | Free | Free |
| Languages | 3 | **Unlimited** | **Unlimited** |
| Projects | 1 | **Unlimited** | **Unlimited** |
| Team members | 2 | **Unlimited** | **Unlimited** |
| Connected sources | 1 | 5 | Unlimited |
| Automatic key discovery | ✓ | ✓ | ✓ |
| Automatic deprecation | ✓ | ✓ | ✓ |
| Usage by source | Basic | ✓ | ✓ |
| React SDK | ✓ | ✓ | ✓ |
| Next.js client | ✓ | ✓ | ✓ |
| Next.js server | ✓ | ✓ | ✓ |
| Static delivery | ✓ | ✓ | ✓ |
| CLI pull | ✓ | ✓ | ✓ |
| Live delivery | 100k requests | 1M requests | Custom |
| AI translation | 5k words | 25k words | Custom |
| BYO AI key | — | ✓ | ✓ |
| Import/export | ✓ | ✓ | ✓ |
| API access | Limited | ✓ | ✓ |
| Webhooks | — / limited | ✓ | ✓ |
| Translation history | 30 days | Full | Full |
| Comments/review | — | ✓ | ✓ |
| Glossary* | — | ✓ | ✓ |
| Translation memory* | — | ✓ | ✓ |
| SAML SSO | — | — | ✓ |
| SCIM | — | — | ✓ |
| Audit logs | — | — | ✓ |
| SLA | — | — | ✓ |
| Migration assistance | — | — | ✓ |

`*` Only advertise features once implemented.

---

# What Keykit should not charge for

Do not charge Pro customers for:

- additional languages
- developer seats
- translator seats
- reviewer seats
- deprecated keys
- archived keys
- translation edits
- discovery scans
- CLI pulls
- static-delivery traffic
- normal management API usage within reasonable abuse limits

Pricing philosophy:

> **We charge when your product grows—not when your team collaborates.**

---

# Pricing-page messaging

## Main headline

```txt
Pay for what your product uses. Not how many people work on it.
```

## Supporting copy

```txt
Unlimited languages and team members on Pro.

Pay based on active translation keys, optional AI usage and live delivery.

Deprecated and archived keys never count.
```

---

# Pricing differentiators

## No seat tax

```txt
Invite your whole team without increasing your bill.
```

## Unlimited languages on Pro

```txt
Adding another market should not create another subscription fee.
```

## Deprecated keys are free

```txt
When your product stops using a translation key, it stops counting toward your active-key allowance.
```

## Static delivery is free from traffic billing

```txt
Pull translations into your application and deploy them normally without runtime delivery fees.
```

## Bring your own AI key

```txt
Use your own supported AI provider and pay Keykit no AI markup.
```

---

# Why not fully usage-based pricing?

Avoid billing like:

```txt
$0.000003 / key scan
$0.00001 / API request
$0.002 / translation edit
$0.0004 / locale lookup
```

Customers should be able to predict their monthly bill quickly.

Recommended structure:

```txt
Predictable plan
+
small number of transparent usage blocks
```

Specifically:

```txt
$29 Pro base
+
active-key blocks
+
optional live-delivery overage
+
optional AI overage
+
optional additional sources
```

This keeps Keykit modular without turning pricing into AWS.

---

# Suggested initial launch pricing

## Free

```txt
$0
500 active keys
3 languages
1 project
1 source
2 members
100k live requests
5k AI words
```

## Pro

```txt
$29/month
3,000 active keys
Unlimited languages
Unlimited projects
Unlimited members
5 sources
1M live requests
10 GB live bandwidth
25k AI words
```

Overages:

```txt
+$4 / additional 1,000 active keys
+$3 / additional 1M live requests
+$2 / additional 10 GB
+$3 / additional source
AI usage: final rate after cost measurement
```

## Enterprise

```txt
From $299/month
25k+ active keys
Unlimited languages
Unlimited projects
Unlimited members
Unlimited sources
Custom delivery
Custom AI capacity
Security/governance/SLA
```

---

# Pricing implementation notes

Before launch:

1. Measure actual AI translation costs.
2. Measure live-delivery bandwidth and request costs.
3. Decide whether usage resets monthly by calendar month or billing cycle.
4. Decide how active keys are calculated when scans temporarily fail.
5. Add a grace period before a key becomes billable or non-billable if needed.
6. Ensure deprecated keys genuinely stop counting.
7. Build clear usage meters into billing settings.
8. Send warnings at 80%, 90% and 100% of included usage.
9. Never unexpectedly disable production translation delivery.
10. Make overage pricing visible before customers incur it.

---

# Recommended product usage dashboard

Show:

```txt
Active keys
2,341 / 3,000

Languages
12 / Unlimited

Sources
3 / 5

Live requests
640k / 1M

Bandwidth
4.2 GB / 10 GB

AI translated words
18,200 / 25,000
```

Also show:

```txt
Deprecated keys
1,284
Not billable
```

That last number reinforces the value of Keykit's cleanup model.

---

# Final pricing philosophy

The cleanest Keykit model is:

```txt
Free
→ real product trial

Pro $29
→ predictable base subscription

Usage blocks
→ pay only when application usage grows

Enterprise
→ governance, security, support and committed capacity
```

The strongest pricing differentiator is:

> **Active keys cost money. Deprecated keys do not.**
