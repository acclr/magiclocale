import type { LocaleOption } from '../../domain/translations';
import { getLocaleDisplay } from '../../domain/translations';

import LocaleFlag from './LocaleFlag';

type LocaleNameProps = {
  code: string;
  option?: LocaleOption;
  variant?: 'full' | 'compact';
};

const LocaleName = ({ code, option, variant = 'compact' }: LocaleNameProps) => {
  const display = option ?? getLocaleDisplay(code);

  return (
    <LocaleFlag
      countryCode={display.countryCode}
      size={variant === 'compact' ? 'sm' : 'sm'}
      title={display.label}
    />
  );
};

export default LocaleName;
