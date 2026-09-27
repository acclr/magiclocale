import { Reveal } from "./reveal";

const locales = [
  "en-US",
  "de-DE",
  "ja-JP",
  "fr-FR",
  "pt-BR",
  "zh-CN",
  "es-MX",
  "ko-KR",
  "it-IT",
  "ar-EG",
  "sv-SE",
  "hi-IN",
  "nl-NL",
  "pl-PL",
  "tr-TR",
  "da-DK",
];

export function LocaleStrip() {
  return (
    <section className="mx-auto max-w-6xl px-6">
      <Reveal>
        <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-surface px-6 py-6">
          {locales.map((locale) => (
            <span
              key={locale}
              className="rounded-full bg-background/60 px-3 py-1 font-mono text-[11px] text-muted-foreground"
            >
              {locale}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

const features = [
  {
    num: "01",
    title: "Keys as code",
    desc: "Every string lives in your repo as a typed key. Rename it and Keykit follows through every locale, every branch, every release.",
    mono: 't("checkout.pay_now")',
  },
  {
    num: "02",
    title: "Review without the ping-pong",
    desc: "Translators see the key, the screenshot, and the context in one place. Approved strings land back on your branch.",
    mono: "review → approve → merge",
  },
  {
    num: "03",
    title: "Sync that knows what changed",
    desc: "The CLI diffs your locale files, uploads only what moved, and opens the PR. Webhooks flag any locale that drops below complete.",
    mono: "keykit sync --diff",
  },
  {
    num: "04",
    title: "Coverage you can see",
    desc: "Missing, stale, and untranslated keys surface per release. Nothing ships half-localized by accident.",
    mono: "de 100% · ja 97%",
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28">
      <Reveal>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Why keykit
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Built around the way strings actually move.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-3 sm:grid-cols-2">
        {features.map((feature, i) => (
          <Reveal key={feature.num} delay={i * 60}>
            <div className="flex h-full flex-col rounded-2xl bg-surface p-7">
              <span className="font-mono text-xs text-muted-foreground">{feature.num}</span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              <code className="mt-6 w-fit rounded-full bg-background/60 px-3 py-1.5 font-mono text-[11px] text-muted-foreground">
                {feature.mono}
              </code>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const problems = [
  {
    before: "Strings scattered across spreadsheets",
    after: "One key store, versioned with your code",
  },
  {
    before: "Translators guessing at context",
    after: "Screenshots and usage attached to every key",
  },
  {
    before: "Release blocked on a missing locale",
    after: "Coverage checked in CI before merge",
  },
  {
    before: "Manual copy-paste back into the repo",
    after: "Approved strings land as a pull request",
  },
];

export function WhyItMatters() {
  return (
    <section id="why" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28">
      <Reveal>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
          The shift
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Localization stops being the thing that slows the release.
        </h2>
      </Reveal>

      <div className="mt-12 overflow-hidden rounded-2xl bg-surface">
        {problems.map((row, i) => (
          <Reveal key={row.before} delay={i * 50}>
            <div className="grid items-center gap-3 px-7 py-6 sm:grid-cols-[1fr_auto_1fr]">
              <p className="text-sm text-muted-foreground line-through decoration-muted-foreground/40">
                {row.before}
              </p>
              <span className="font-mono text-xs text-orange">→</span>
              <p className="text-sm text-foreground">{row.after}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const stats = [
  { value: "12×", label: "faster locale turnaround than a spreadsheet handoff" },
  { value: "0", label: "manual copy-paste steps between review and repo" },
  { value: "40+", label: "locales managed from a single project" },
  { value: "1.4s", label: "average CLI sync across a full key set" },
];

export function Metrics() {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Reveal key={stat.value} delay={i * 50}>
            <div className="h-full rounded-2xl bg-surface p-7">
              <p className="text-4xl font-semibold tracking-tight text-foreground">{stat.value}</p>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{stat.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

const terminalLines = [
  { text: "$ keykit sync", tone: "text-foreground", prompt: true },
  { text: "↟  uploading 8 changed keys across 12 locales", tone: "text-muted-foreground" },
  { text: "✓  de-DE · fr-FR · es-ES at 100%", tone: "text-blue" },
  { text: "●  ja-JP — 3 keys awaiting review", tone: "text-orange" },
  { text: "↗  opened PR #482 — “i18n: october strings”", tone: "text-foreground" },
  { text: "done in 1.4s", tone: "text-muted-foreground/70" },
];

const bullets = [
  "Typed keys generated from your locale files — autocomplete everywhere.",
  "Works with JSON, YAML, ICU, and gettext out of the box.",
  "Diff-aware sync: only changed keys travel.",
  "Webhooks for coverage drops, review requests, and new keys.",
];

export function DeveloperSection() {
  return (
    <section id="developers" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <Reveal>
          <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            For developers
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            A CLI your pipeline already understands.
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Keykit lives in your terminal and your CI. Push keys with a commit, pull approved
            translations with a build step — localization stops being a separate project.
          </p>
          <ul className="mt-8 space-y-4">
            {bullets.map((bullet) => (
              <li key={bullet} className="flex items-start gap-3 text-sm text-muted-foreground">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {bullet}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={120}>
          <div className="overflow-hidden rounded-2xl bg-surface">
            <div className="px-5 py-3.5">
              <span className="font-mono text-xs text-muted-foreground">~/app — keykit</span>
            </div>
            <div className="mx-3 mb-3 space-y-2.5 rounded-xl bg-background/60 px-5 py-5 font-mono text-[13px] leading-relaxed">
              {terminalLines.map((line) => (
                <p key={line.text} className={line.tone}>
                  {line.prompt ? (
                    <>
                      <span className="text-blue">{line.text.slice(0, 2)}</span>
                      {line.text.slice(2)}
                    </>
                  ) : (
                    line.text
                  )}
                </p>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const steps = [
  {
    step: "Connect",
    desc: "Point Keykit at your repo and locale files. It reads your existing structure — no migration.",
  },
  {
    step: "Translate",
    desc: "New keys appear for your translators with context. Machine drafts first, humans approve.",
  },
  {
    step: "Ship",
    desc: "Approved strings come back as a pull request. CI blocks anything below your coverage bar.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24 sm:py-28">
      <Reveal>
        <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
          How it works
        </p>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Three steps, then it runs itself.
        </h2>
      </Reveal>

      <div className="mt-12 grid gap-3 md:grid-cols-3">
        {steps.map((item, i) => (
          <Reveal key={item.step} delay={i * 70}>
            <div className="h-full rounded-2xl bg-surface p-7">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/60 font-mono text-xs text-muted-foreground">
                {i + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-foreground">
                {item.step}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function CtaSection() {
  return (
    <section id="cta" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-16">
      <Reveal>
        <div className="rounded-3xl bg-surface px-6 py-20 text-center sm:px-16">
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Your product, fluent in every market.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
            Create a project, push your keys, and watch every locale fall in line.
          </p>
          <a
            href="#"
            className="mt-9 inline-block rounded-full bg-blue px-8 py-3 text-sm font-semibold text-background transition-colors hover:bg-blue-soft"
          >
            Start free
          </a>
        </div>
      </Reveal>
    </section>
  );
}
