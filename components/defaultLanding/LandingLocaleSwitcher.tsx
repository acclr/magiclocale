import { Button } from '@/components/ui/button';
import { KEYKIT_LOCALE_COOKIE } from '@/lib/self-hosted-locale';

import { useLandingI18n } from './LandingLocaleProvider';

function persistLandingLocale(locale: string): void {
  document.cookie =
    `${encodeURIComponent(KEYKIT_LOCALE_COOKIE)}=${encodeURIComponent(locale)}; ` +
    'Path=/; Max-Age=31536000; SameSite=Lax';
}

const LandingLocaleSwitcher = () => {
  const { locale, locales, isLoading, setLocale } = useLandingI18n();

  if (locales.length < 2) {
    return null;
  }

  return (
    <div
      className="inline-flex overflow-hidden rounded-lg border border-border/80 bg-muted/30 p-0.5"
      role="group"
      aria-label="Language"
    >
      {locales.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={locale === code ? 'secondary' : 'ghost'}
          className="h-8 min-w-10 rounded-md px-2.5 font-mono text-xs"
          aria-pressed={locale === code}
          disabled={isLoading}
          onClick={() => {
            if (code === locale) {
              return;
            }
            persistLandingLocale(code);
            void setLocale(code);
          }}
        >
          {code.toUpperCase()}
        </Button>
      ))}
    </div>
  );
};

export default LandingLocaleSwitcher;
