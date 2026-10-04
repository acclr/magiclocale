import Link from 'next/link';

import { useKeykit } from '@keykithq/sdk/react';

import HeroDemo from './hero/HeroDemo';
import Reveal from './Reveal';

const HeroSection = () => {
  const { translate } = useKeykit();

  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 pt-36 pb-16 sm:pt-44 sm:pb-24">
        <Reveal className="mx-auto w-full text-center">
          <h1 className="mt-6 text-balance text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
            {translate(
              'landing.hero.headline-accent',
              'Product copy, localized'
            )}
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {translate(
              'landing.hero.subtitle',
              'Discover keys in your app, review translations with your team, and ship every locale from one dashboard.'
            )}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/join"
              className="rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
            >
              {translate('landing.hero.get-started', 'Get started')}
            </Link>
            <a
              href="#features"
              className="rounded-lg bg-surface px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-elevated"
            >
              {translate('landing.hero.explore', 'See how it works')}
            </a>
          </div>
        </Reveal>

        <Reveal delay={150} className="relative mt-16 sm:mt-20">
          <HeroDemo />
          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            {translate(
              'landing.hero.demo-caption',
              'Write a key in code. Keykit discovers it, AI fills every locale, and your team reviews it in the same editor.'
            )}
          </p>
        </Reveal>
      </div>
    </section>
  );
};

export default HeroSection;
