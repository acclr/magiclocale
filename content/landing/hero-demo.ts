import type { HeroDemoScript } from '@/domain/landing/hero-demo';

export const heroDemoScript: HeroDemoScript = {
  fileName: 'LoginForm.tsx',
  code: {
    before: [
      "import { useKeykit } from '@keykithq/sdk/react';",
      '',
      'export function LoginForm() {',
      '  const { translate: t } = useKeykit();',
      '',
      '  return (',
      '    <form action="/auth/login">',
      '      <input name="email" type="email" />',
    ],
    prefix: '      <button type="submit">',
    typed: '{t("common.actions.login", "Login")}',
    suffix: '</button>',
    after: ['    </form>', '  );', '}'],
  },
  key: 'common.actions.login',
  sourceLocale: 'en',
  sourceText: 'Login',
  translations: {
    sv: 'Logga in',
    de: 'Anmelden',
  },
  existingKeys: [
    {
      key: 'common.actions.sign-up',
      values: {
        en: { value: 'Sign up', source: 'code' },
        sv: { value: 'Registrera dig', source: 'manual' },
        de: { value: 'Registrieren', source: 'ai' },
      },
    },
    {
      key: 'auth.form.email-label',
      values: {
        en: { value: 'Email address', source: 'code' },
        sv: { value: 'E-postadress', source: 'ai' },
        de: { value: 'E-Mail-Adresse', source: 'manual' },
      },
    },
    {
      key: 'common.actions.logout',
      values: {
        en: { value: 'Log out', source: 'code' },
        sv: { value: 'Logga ut', source: 'ai' },
        de: { value: 'Abmelden', source: 'ai' },
      },
    },
  ],
};
