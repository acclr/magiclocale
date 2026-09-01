import { useLandingI18n } from './LandingLocaleProvider';

const LandingLocaleSwitcher = () => {
  const { locale, locales, isLoading, setLocale } = useLandingI18n();

  if (locales.length < 2) {
    return null;
  }

  return (
    <div className="join" role="group" aria-label="Language">
      {locales.map((code) => (
        <button
          key={code}
          type="button"
          className={`btn btn-sm join-item ${
            locale === code ? 'btn-primary' : 'btn-ghost'
          }`}
          aria-pressed={locale === code}
          disabled={isLoading}
          onClick={() => void setLocale(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
};

export default LandingLocaleSwitcher;
