import { hrefForLocaleSlug } from '@keykithq/sdk/routing';
import { useKeykit } from '@keykithq/sdk/react';
import { cn } from 'cn';

import { landingRouting, landingSite } from '@/content/landing/site';

const LandingLocaleSwitcher = () => {
  const { locale } = useKeykit();
  const locales = landingSite.locales;

  if (locales.length < 2) {
    return null;
  }

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language">
      {locales.map((code) => {
        const active = locale === code;
        return (
          <a
            key={code}
            href={hrefForLocaleSlug(code, '', landingRouting)}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors',
              active
                ? 'bg-elevated text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {code.toUpperCase()}
          </a>
        );
      })}
    </div>
  );
};

export default LandingLocaleSwitcher;
