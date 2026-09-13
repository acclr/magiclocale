import { useCallback, useContext } from 'react';

import { DashboardI18nContext } from '@/lib/dashboard-i18n-context';
import {
  translateDashboardKey,
  type DashboardTranslateOptions,
} from '@/lib/dashboard-translation';

export function useTranslation(namespace = 'common') {
  void namespace;
  const { locale, translate } = useContext(DashboardI18nContext);

  const t = useCallback(
    (key: string, options?: DashboardTranslateOptions | string) =>
      translateDashboardKey(key, options, translate),
    [translate]
  );

  return {
    t,
    i18n: {
      language: locale,
    },
  };
}
