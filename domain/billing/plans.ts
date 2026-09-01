export type MagilocalePlanId = 'starter' | 'enterprise';

export type MagilocalePlan = {
  id: MagilocalePlanId;
  name: string;
  amountCents: number;
  interval: 'month';
  maxLocales: number | null;
  description: string;
  features: string[];
};

export const STARTER_MAX_LOCALES = 4;

export const MAGILOCALE_PLANS: Record<MagilocalePlanId, MagilocalePlan> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    amountCents: 500,
    interval: 'month',
    maxLocales: STARTER_MAX_LOCALES,
    description:
      '$5/month for standard usage. Includes up to 4 languages per project.',
    features: [
      'Automatic key discovery',
      'AI fill and human review',
      'Up to 4 languages per project',
      'Team dashboard and API keys',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    amountCents: 5_000,
    interval: 'month',
    maxLocales: null,
    description:
      '$50/month when a project needs 5 or more languages, with higher usage.',
    features: [
      'Everything in Starter',
      '5+ languages per project',
      'Unlimited locales',
      'Priority translation usage',
    ],
  },
};

export function canAddProjectLocale(
  currentLocaleCount: number,
  maxLocales: number | null
): boolean {
  if (maxLocales === null) {
    return true;
  }
  return currentLocaleCount < maxLocales;
}

export function localeLimitMessage(maxLocales: number): string {
  return (
    `Starter includes up to ${maxLocales} languages per project. ` +
    'Upgrade to Enterprise ($50/mo) to add a 5th language.'
  );
}

export type MagilocaleEntitlement = {
  planId: MagilocalePlanId;
  plan: MagilocalePlan;
  subscribed: boolean;
  maxLocales: number | null;
  priceId: string | null;
};
