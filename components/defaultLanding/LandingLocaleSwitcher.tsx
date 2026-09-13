import { Button } from '@/components/ui/button';

import { useLandingI18n } from './LandingLocaleProvider';

const LandingLocaleSwitcher = () => {
  const { locale, locales, isLoading, setLocale } = useLandingI18n();

  if (locales.length < 2) {
    return null;
  }

  return (
    <div className="inline-flex overflow-hidden rounded-md border border-border" role="group" aria-label="Language">
      {locales.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={locale === code ? 'default' : 'ghost'}
          className="rounded-none"
          aria-pressed={locale === code}
          disabled={isLoading}
          onClick={() => void setLocale(code)}
        >
          {code.toUpperCase()}
        </Button>
      ))}
    </div>
  );
};

export default LandingLocaleSwitcher;
