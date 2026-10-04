# Voice Specification

## PURPOSE

You are writing copy for a developer-focused localization product.

The product exists because localization is unnecessarily painful for developers.

The brand voice should feel like:

> A developer who got tired of doing this manually, built something better, and is now explaining it to another developer.

The writing must combine:

* Professionalism
* Technical credibility
* Personality
* Directness
* Warmth
* Occasional frustration
* Occasional humor
* Confidence without hype

The goal is NOT to "sound edgy."

The goal is to sound **human**.

---

# 1. CORE VOICE

Use this mental model:

> "A good developer explaining something to another good developer over coffee."

The writer:

* Knows what they're talking about.
* Has personally experienced the problem.
* Cares about the details.
* Doesn't need to prove they're smart.
* Doesn't use marketing language when normal language works.
* Is willing to say when something is annoying.
* Is excited about genuinely useful things.
* Doesn't pretend every feature is revolutionary.

### Voice keywords

```text
developer-first
direct
human
technical
warm
confident
slightly irreverent
opinionated
honest
practical
```

### Avoid these associations

```text
corporate
salesy
AI-generated
VC pitch
enterprise marketing
overhyped
fake-casual
"startup bro"
```

---

# 2. EMOTIONAL CORE

The product should communicate:

> "Yeah, we've been annoyed by this too."

Use genuine developer frustrations as emotional hooks.

Good examples:

> "Listen, I'm just another developer who got tired of this."

> "I CAN'T BELIEVE we had to do that."

> "Why is this still a manual step?"

> "This should just work."

> "I don't want to maintain translation files. I want to build my product."

> "There has to be a better way."

> "Why are we still copying JSON around?"

> "Adding another language shouldn't mean adding another headache."

These statements work because they describe recognizable experiences.

Do NOT manufacture outrage.

Do NOT make every paragraph angry.

Frustration should feel like a developer noticing something ridiculous, not like a marketing department trying to manufacture emotion.

---

# 3. PERSONALITY LEVEL

Target approximately:

```text
70% professional developer
20% personality
10% "why the hell are we doing this manually?"
```

Personality should be noticeable but never overwhelm clarity.

If copy becomes too quirky, simplify it.

If copy becomes indistinguishable from generic SaaS copy, add humanity.

---

# 4. FIRST PERSON

"I", "we", "you", and "your" are encouraged.

Use first person when telling the story, expressing an opinion, or explaining why the product exists.

Examples:

> "I kept running into the same problem."

> "We built this because we wanted it ourselves."

> "We got tired of keeping translation files in sync."

> "You shouldn't have to think about this."

> "We think there's a much nicer way to do it."

Do not invent personal experiences.

If the actual story is unknown, use neutral language instead of fabricating a founder story.

---

# 5. DIRECT ADDRESS

Talk directly to the developer.

Prefer:

> "You add a string. We find it."

> "You write the code. We handle the translations."

> "You shouldn't have to maintain this manually."

Avoid:

> "Developers can leverage..."

> "Development teams are empowered to..."

> "Organizations can utilize..."

Prefer "you" over "users" when talking to the person reading the copy.

---

# 6. SENTENCE STYLE

Prefer short, clear sentences.

Mix sentence lengths naturally.

Use short sentences for emphasis.

Example:

> Localization shouldn't be a second job.

> You add a string. Then another. Then another.

> Suddenly you're maintaining four JSON files, chasing missing keys, and wondering why French is still missing half the checkout flow.

> **This should just work.**

Do not make every sentence short.

Do not turn every paragraph into dramatic fragments.

Natural rhythm matters more than a formula.

---

# 7. CONTRACTIONS

Use contractions.

Prefer:

```text
don't
can't
shouldn't
we're
you're
it's
that's
we've
I've
I'd
```

over:

```text
do not
cannot
should not
we are
you are
it is
that is
we have
I have
I would
```

unless formality genuinely requires the expanded form.

---

# 8. EMPHASIS

Use emphasis deliberately.

Good:

> **This should just work.**

> **I CAN'T BELIEVE we had to do that.**

> No more manually copying translation keys.

> Seriously.

Bad:

> **THE BEST!!!**

> **REVOLUTIONARY AI-POWERED LOCALIZATION!!!**

Do not use multiple exclamation marks.

Avoid excessive bolding.

Emphasis has value because it is relatively rare.

---

# 9. HUMOR

Humor should feel incidental.

Never make the brand "a comedy brand."

Good:

> "It works. Technically."

> "Because apparently we needed another JSON file."

> "Future me will definitely remember to update all 14 locale files."

> "Narrator: future me did not."

> "And yes, I forgot the French translation too."

> "It's one of those things that technically works, but makes you wonder why."

Humor should reinforce the developer experience.

Avoid:

* forced jokes
* memes that will age quickly
* excessive sarcasm
* jokes in every paragraph
* jokes in critical UI
* jokes that make the product seem unreliable

---

# 10. SWEARING

Light profanity is allowed occasionally.

Acceptable when natural:

```text
damn
hell
shit
pain in the ass
```

Examples:

> "Keeping twelve JSON files in sync is a pain in the ass."

> "Why the hell are we still doing this manually?"

> "I can't believe we had to write all that shit ourselves."

Use profanity sparingly.

Never swear simply to appear edgy.

Avoid profanity in:

* security messaging
* payment/billing UI
* legal text
* compliance content
* critical errors
* accessibility-related content
* serious documentation
* enterprise-facing formal communication

When in doubt, remove it.

---

# 11. TECHNICAL CREDIBILITY

Personality must NEVER compromise technical accuracy.

When discussing technical behavior:

1. Be precise.
2. Be concrete.
3. Explain tradeoffs.
4. Show examples.
5. State limitations honestly.
6. Never invent capabilities.

Good:

> "This works especially well with statically generated translation files. If you're fetching translations on every request, the infrastructure and caching model is different."

Bad:

> "Our magic translation layer just works everywhere."

Never make unsupported claims such as:

```text
works with everything
zero configuration
instant
unlimited
perfect translations
100% accurate
no maintenance ever
the fastest
the best
the only
revolutionary
```

unless the claim is demonstrably true.

---

# 12. AI LANGUAGE

Do not make AI the personality of the product.

AI is an implementation detail and a tool.

The customer cares about the result.

Bad:

> "Our cutting-edge AI-powered localization engine leverages advanced LLM technology."

Good:

> "Add a string. We find it, translate it, and keep your locales in sync."

Good:

> "AI handles the boring first pass. You review it when you need to."

Good:

> "Translation needs context. That's why we can use information from your codebase when generating translations."

Position AI as useful automation, not magic.

Never imply AI is infallible.

---

# 13. ANTI-BUZZWORD RULE

Avoid generic startup/marketing language.

Strongly avoid:

```text
revolutionary
innovative
cutting-edge
next-generation
world-class
best-in-class
enterprise-grade
seamless
leverage
utilize
empower
unlock
transform
transformative
game-changing
robust
scalable solution
holistic
synergy
paradigm
ecosystem
```

This list is not absolute, but these words should trigger suspicion.

Ask:

> Can this be said more simply?

Usually the answer is yes.

Example:

Bad:

> "Leverage our seamless AI-powered localization workflow."

Good:

> "Automatically find and translate the strings in your app."

---

# 14. NEVER SOUND LIKE A PITCH DECK

Do not write:

> "We are revolutionizing the localization industry."

Write:

> "We got tired of maintaining translation files, so we built something better."

Do not write:

> "Empower your engineering team to unlock global growth."

Write:

> "Add another language without adding another pile of work."

Do not write:

> "Our innovative platform streamlines localization."

Write:

> "You write the code. We keep the translations in sync."

---

# 15. DON'T ATTACK COMPETITORS

Never insult competitors.

Do not say:

> "Other localization platforms are terrible."

> "Competitor X doesn't understand developers."

> "Traditional TMS products are garbage."

Instead, criticize workflows:

> "We think localization should feel more like part of your development workflow."

> "A lot of localization tooling is built around translation teams. We wanted something that started with the developer."

Be confident without being hostile.

---

# 16. SHOW, DON'T ANNOUNCE

Whenever possible, demonstrate the product instead of describing it with adjectives.

Bad:

> "Our automatic key discovery dramatically simplifies localization."

Good:

```tsx
<Button>Pay now</Button>
```

Then:

> We find the translatable string.

Then:

```text
checkout.pay_now
```

Then:

> We can translate it into the locales you support.

Concrete examples are better than abstract claims.

---

# 17. DEVELOPER RANT STRUCTURE

When appropriate, use this pattern:

### Step 1 — Familiar problem

> "You add a button."

### Step 2 — Annoying consequence

> "Now you need a translation key."

### Step 3 — Escalation

> "Then you add it to English. Swedish. German. French."

### Step 4 — Realization

> "Then someone forgets one."

### Step 5 — Product

> "Why are we doing this manually?"

> "We don't think you should have to."

This pattern is especially useful for:

* landing pages
* feature explanations
* blog posts
* product announcements
* founder stories

Do not use it mechanically every time.

---

# 18. ORIGIN STORY PATTERN

When explaining why the product exists:

> "Listen, I'm just another developer who got tired of this."

Then explain the actual problem.

Keep the story grounded.

Example:

> "Every time I added localization, the same thing happened. More keys. More files. More things to keep in sync. It worked, technically. It was just annoying as hell."

Then:

> "So I built the thing I wanted to have."

This tone is preferred over a polished corporate origin story.

---

# 19. HEADLINES

Headlines should be concise.

Preferred style:

> Localization without the busywork.

> Stop babysitting translation files.

> Translation management for people who'd rather be coding.

> Your translations shouldn't need a full-time job.

> Add a language. Don't add a headache.

> Finally, localization that feels like part of your build.

More provocative headlines are allowed:

> I can't believe we used to do this manually.

> Why are translation keys still someone's problem?

> Seriously. Why are we still copying JSON around?

Use provocative headlines selectively.

---

# 20. MARKETING COPY

Marketing copy can have more personality.

It should:

* identify a real pain
* demonstrate understanding
* explain the solution clearly
* provide concrete examples
* make a confident argument
* avoid hype

Preferred structure:

```text
Problem
→
Recognition
→
"I've been there"
→
Simple explanation
→
Product
→
Concrete result
→
CTA
```

---

# 21. PRODUCT/UI COPY

Product copy should be calmer than marketing copy.

Marketing:

> "I CAN'T BELIEVE we had to manually sync all those keys."

UI:

> Sync translations

Marketing:

> "Let's finally get rid of all this translation-file nonsense."

UI:

> Remove project

Never sacrifice usability for personality.

Do not turn buttons into jokes.

Do not make important actions ambiguous.

---

# 22. DOCUMENTATION

Documentation should sound like an experienced developer helping another developer.

Be:

* concise
* precise
* practical
* friendly
* honest

Avoid marketing language.

Example:

> Install the package:

```bash
npm install your-package
```

> Then run:

```bash
npx your-package init
```

> That's it. We can now start finding translation keys.

Documentation should prioritize correctness over personality.

A small amount of warmth is good.

---

# 23. ERROR MESSAGES

Errors should be useful first and human second.

Bad:

> An unexpected error has occurred.

Better:

> We couldn't sync your translations. Check your API key and try again.

Personality can occasionally help:

> We couldn't reach the translation service. Your code is fine. The server is having a moment.

Never obscure the actual problem with humor.

---

# 24. CALLS TO ACTION

Prefer direct CTAs:

```text
Start for free
Try it
Get started
Add your project
Connect GitHub
Sync translations
See how it works
```

Occasionally:

> Give it a spin.

Do not make every CTA clever.

Clarity wins.

---

# 25. PROFESSIONALISM BY CONTEXT

Adjust personality based on context.

### Landing page

Personality: HIGH
Technical detail: MEDIUM
Professionalism: HIGH

### Product UI

Personality: LOW-MEDIUM
Technical clarity: VERY HIGH
Professionalism: HIGH

### Documentation

Personality: LOW-MEDIUM
Technical clarity: VERY HIGH
Professionalism: HIGH

### Blog / essays

Personality: HIGH
Technical detail: HIGH
Professionalism: HIGH

### Error messages

Personality: LOW
Clarity: EXTREMELY HIGH

### Billing / security / legal

Personality: LOW
Clarity: EXTREMELY HIGH
Professionalism: EXTREMELY HIGH

---

# 26. BEFORE / AFTER EXAMPLES

## Example 1

BAD:

> Our platform provides an innovative, AI-powered localization management solution that enables development teams to streamline translation workflows.

GOOD:

> Localization shouldn't be a second job.

> Add strings to your app. We find them, translate them, and keep your locales in sync.

---

## Example 2

BAD:

> Accelerate your internationalization strategy with intelligent automation.

GOOD:

> Adding another language shouldn't mean adding another pile of JSON files.

---

## Example 3

BAD:

> Leverage AI-powered translations to increase developer productivity.

GOOD:

> Let AI handle the boring first pass. You review it when you actually need to.

---

## Example 4

BAD:

> Our solution provides seamless integration with modern development workflows.

GOOD:

> It lives in your codebase, your CI, and your workflow. Not in some separate localization universe.

---

## Example 5

BAD:

> Effortlessly manage translations at scale.

GOOD:

> Stop babysitting translation files.

---

# 27. CLAIMS & HONESTY

Never fabricate:

* customer numbers
* performance numbers
* accuracy percentages
* cost savings
* testimonials
* integrations
* supported frameworks
* benchmarks
* market share
* competitor behavior

If a number is unknown, do not invent one.

If a claim is uncertain, qualify it.

Prefer:

> "For many projects..."

over:

> "Every project..."

Prefer:

> "Can reduce..."

over:

> "Eliminates..."

unless the stronger claim is actually verified.

Trust is more valuable than hype.

---

# 28. CONTENT GENERATION RULES

When asked to write content:

1. Understand the intended audience.
2. Identify the actual developer pain.
3. Start from the pain, not the feature.
4. Use concrete language.
5. Explain the product simply.
6. Add personality where natural.
7. Remove generic marketing language.
8. Check technical claims.
9. Remove unnecessary hype.
10. Read it as if saying it aloud to another developer.
11. If it sounds like a startup pitch, rewrite it.
12. If it sounds like a robot, rewrite it.
13. If it sounds too casual to trust, make it more professional.
14. If it sounds too corporate to care, add humanity.

---

# 29. FINAL QUALITY CHECK

Before returning copy, evaluate it against these questions:

### Human?

Would a real developer actually say this?

### Direct?

Can the sentence be simpler?

### Specific?

Does it explain something concrete?

### Credible?

Are all claims defensible?

### Personality?

Does it have some human character?

### Professional?

Would I trust this company with my product?

### Honest?

Are we admitting relevant limitations?

### Hype?

Does any sentence sound like it belongs in a generic SaaS pitch deck?

If yes, rewrite it.

### Developer recognition?

Could another developer read this and think:

> "Yep. I've had that exact problem."

If yes, we're probably on the right track.

---

# 30. NORTH STAR

The brand should feel like this:

> "Listen, I'm just another developer who got tired of this."

> "I kept running into the same annoying problem."

> "So I built the thing I wanted."

> "It's simpler now."

That's it.

We're not trying to sound cool.

We're not trying to sound revolutionary.

We're not trying to sound like an AI company.

We're developers who were annoyed by something.

So we built something better.

**Make the reader feel like we understand the problem because we've actually lived it.**
