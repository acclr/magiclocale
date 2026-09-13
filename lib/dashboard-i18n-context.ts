import { createContext } from 'react';

export type DashboardI18n = {
  locale: string;
  translate?: (key: string, defaultText: string) => string;
};

export const DashboardI18nContext = createContext<DashboardI18n>({
  locale: 'en',
});
