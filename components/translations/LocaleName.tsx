import type { LocaleOption } from '../../domain/translations';
import { getLocaleDisplay } from '../../domain/translations';

type LocaleNameProps = {
  code: string;
  option?: LocaleOption;
  variant?: 'full' | 'compact';
};

const LocaleName = ({ code, option, variant = 'compact' }: LocaleNameProps) => {
  const display = option ?? getLocaleDisplay(code);

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      {display.flag ? (
        <span aria-hidden className="shrink-0 text-base leading-none">
          {display.flag}
        </span>
      ) : null}
      {variant === 'full' ? (
        <span className="min-w-0 truncate">
          <span>{display.label}</span>
          <span className="ml-2 font-mono text-xs text-base-content/50">
            {display.code}
          </span>
        </span>
      ) : (
        <span className="font-mono text-xs font-semibold">{display.code}</span>
      )}
    </span>
  );
};

export default LocaleName;
