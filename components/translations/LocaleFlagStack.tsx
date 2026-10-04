import ReactCountryFlag from 'react-country-flag';

import { getLocaleDisplay } from '../../domain/translations';

const MAX_VISIBLE = 6;

type LocaleFlagStackProps = {
  locales: string[];
  sourceLocale?: string;
};

function orderedLocales(locales: string[], sourceLocale?: string) {
  if (!sourceLocale || !locales.includes(sourceLocale)) {
    return locales;
  }

  return [sourceLocale, ...locales.filter((locale) => locale !== sourceLocale)];
}

const LocaleFlagStack = ({ locales, sourceLocale }: LocaleFlagStackProps) => {
  const ordered = orderedLocales(locales, sourceLocale);
  const visible = ordered.slice(0, MAX_VISIBLE);
  const hidden = ordered.length - visible.length;
  const labels = ordered.map((code) => getLocaleDisplay(code).label);

  return (
    <div
      aria-label={labels.join(', ')}
      className="flex items-center"
      role="img"
    >
      {visible.map((code, index) => {
        const display = getLocaleDisplay(code);
        return (
          <span
            className="relative inline-flex h-4 w-4 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-medium uppercase text-muted-foreground ring-3 ring-card group-hover:ring-muted"
            key={code}
            style={{
              marginLeft: index === 0 ? 0 : -2,
              zIndex: visible.length - index,
            }}
            title={display.label}
          >
            {display.countryCode ? (
              <ReactCountryFlag
                countryCode={display.countryCode}
                svg
                style={{
                  display: 'block',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scale(1.45)',
                }}
                title={display.label}
              />
            ) : (
              display.language.slice(0, 2)
            )}
          </span>
        );
      })}
      {hidden > 0 ? (
        <span
          aria-hidden
          className="ml-2 text-xs font-medium text-muted-foreground"
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  );
};

export default LocaleFlagStack;
