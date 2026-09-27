import Head from 'next/head';
import Link from 'next/link';

import { useKeykit } from '@keykithq/sdk/react';

import FAQSection from './FAQSection';
import FeatureSection from './FeatureSection';
import HeroSection from './HeroSection';
import LandingShell from './LandingShell';
import PricingSection from './PricingSection';
import Reveal from './Reveal';

const LandingHome = () => {
  const { translate } = useKeykit();

  return (
    <>
      <Head>
        <title>
          {translate('landing.meta.title', 'Keykit — product copy, localized')}
        </title>
        <meta
          name="description"
          content={translate(
            'landing.meta.description',
            'Discover translation keys, review copy with your team, and ship every locale from one dashboard.'
          )}
        />
      </Head>

      <LandingShell>
        <HeroSection />
        <FeatureSection />
        <PricingSection />
        <FAQSection />
        <section className="mx-auto max-w-6xl scroll-mt-28 px-6 py-16">
          <Reveal>
            <div className="rounded-xl bg-surface px-6 py-20 text-center sm:px-16">
              <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {translate(
                  'landing.footer.tagline',
                  'Product copy, localized — with a dashboard your team actually uses.'
                )}
              </h2>
              <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-muted-foreground">
                {translate(
                  'landing.hero.subtitle',
                  'Discover keys in your app, review translations with your team, and ship every locale from one dashboard.'
                )}
              </p>
              <Link
                href="/auth/join"
                className="mt-9 inline-block rounded-lg bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/80"
              >
                {translate('landing.hero.get-started', 'Get started')}
              </Link>
            </div>
          </Reveal>
        </section>
      </LandingShell>
    </>
  );
};

export default LandingHome;
