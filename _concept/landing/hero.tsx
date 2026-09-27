import { Reveal } from "./reveal";

type MockRow = {
  key: string;
  value: string;
  status: string;
  tone: "blue" | "orange" | "muted";
};

const toneClasses: Record<MockRow["tone"], string> = {
  blue: "bg-blue/10 text-blue",
  orange: "bg-orange/10 text-orange",
  muted: "bg-elevated text-muted-foreground",
};

const rows: MockRow[] = [
  { key: "checkout.title", value: "Complete your order", status: "Reviewed", tone: "blue" },
  { key: "checkout.pay_now", value: "Pay now", status: "In review", tone: "orange" },
  {
    key: "errors.card_declined",
    value: "Your card was declined",
    status: "Translated",
    tone: "blue",
  },
  { key: "cart.empty", value: "Your cart is empty", status: "Missing", tone: "muted" },
];

const locales = ["EN", "DE", "JA", "ES", "+8"];

function Mockup() {
  return (
    <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-surface">
      {/* window bar */}
      <div className="flex items-center justify-between gap-4 px-5 py-3.5">
        <span className="font-mono text-xs text-muted-foreground">locales/checkout.json</span>
        <div className="hidden items-center gap-1.5 sm:flex">
          {locales.map((locale, i) => (
            <span
              key={locale}
              className={`rounded-full px-2.5 py-1 font-mono text-[10px] tracking-wide ${
                i === 0 ? "bg-elevated text-foreground" : "text-muted-foreground"
              }`}
            >
              {locale}
            </span>
          ))}
        </div>
      </div>

      {/* rows */}
      <div className="mx-3 space-y-1 pb-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 rounded-lg bg-background/60 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_1fr_auto]"
          >
            <span className="truncate font-mono text-xs text-muted-foreground">{row.key}</span>
            <span className="col-span-2 truncate text-sm text-foreground sm:col-span-1">
              {row.value}
            </span>
            <span
              className={`mt-1 w-fit justify-self-start rounded-full px-2.5 py-0.5 font-mono text-[10px] sm:mt-0 sm:justify-self-end ${toneClasses[row.tone]}`}
            >
              {row.status}
            </span>
          </div>
        ))}
      </div>

      {/* status bar */}
      <div className="flex items-center justify-between px-5 py-3.5">
        <span className="font-mono text-[11px] text-muted-foreground">214 keys · 12 locales</span>
        <span className="font-mono text-[11px] text-muted-foreground">+8 new keys · synced 2m ago</span>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-36 pb-20 sm:pt-44">
        <Reveal className="mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.28em] text-muted-foreground">
            Translation management
          </p>
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            Ship in every language, from one source of truth.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Keykit keeps every string, locale, and review in sync with your codebase — so your
            product ships fully translated, on every deploy.
          </p>
          <div className="mt-9 flex items-center justify-center gap-4">
            <a
              href="#cta"
              className="rounded-full bg-blue px-6 py-2.5 text-sm font-semibold text-background transition-colors hover:bg-blue-soft"
            >
              Start free
            </a>
            <a
              href="#developers"
              className="rounded-full bg-surface px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
            >
              Read the docs
            </a>
          </div>
        </Reveal>

        <Reveal delay={150} className="relative mt-16 sm:mt-20">
          <Mockup />
        </Reveal>
      </div>
    </section>
  );
}
