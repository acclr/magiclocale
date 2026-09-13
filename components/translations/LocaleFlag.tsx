import ReactCountryFlag from 'react-country-flag';

type LocaleFlagProps = {
  countryCode?: string;
  title?: string;
  size?: 'sm' | 'md';
};

const sizes = {
  sm: { width: '1.1rem', height: '0.85rem' },
  md: { width: '1.3rem', height: '0.95rem' },
};

const LocaleFlag = ({
  countryCode,
  title,
  size = 'md',
}: LocaleFlagProps) => {
  if (!countryCode) {
    return null;
  }

  return (
    <span
      aria-hidden={!title}
      className="inline-flex shrink-0 overflow-hidden rounded-[4px] border border-foreground/10"
      title={title}
    >
      <ReactCountryFlag
        countryCode={countryCode}
        svg
        style={{
          display: 'block',
          ...sizes[size],
        }}
        title={title ?? countryCode}
      />
    </span>
  );
};

export default LocaleFlag;
