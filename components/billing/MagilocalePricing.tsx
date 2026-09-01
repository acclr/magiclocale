import toast from 'react-hot-toast';
import { Button } from 'react-daisyui';
import { useTranslation } from 'next-i18next';

import useTeam from 'hooks/useTeam';
import type { MagilocalePlan } from '@/domain/billing';

type CatalogPlan = MagilocalePlan & {
  priceId: string | null;
  current: boolean;
};

type MagilocalePricingProps = {
  plans: CatalogPlan[];
  projectId?: string;
};

const MagilocalePricing = ({ plans, projectId }: MagilocalePricingProps) => {
  const { team } = useTeam();
  const { t } = useTranslation('common');

  const initiateCheckout = async (priceId: string) => {
    const res = await fetch(
      `/api/teams/${team?.slug}/payments/create-checkout-session`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          price: priceId,
          quantity: 1,
          ...(projectId ? { projectId } : {}),
        }),
      }
    );
    const data = await res.json();
    if (data?.data?.url) {
      window.open(data.data.url, '_blank', 'noopener,noreferrer');
      return;
    }
    toast.error(data?.error?.message || t('stripe-checkout-fallback-error'));
  };

  return (
    <section className="py-3">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plans.map((plan) => (
          <div
            className="relative rounded-md border border-gray-200 bg-white"
            key={plan.id}
          >
            <div className="p-8">
              <h3 className="font-display text-2xl font-bold text-black">
                {plan.name}
              </h3>
              <p className="mt-2 text-3xl font-semibold">
                ${plan.amountCents / 100}
                <span className="text-base font-normal text-gray-500">
                  {' '}
                  / {plan.interval}
                </span>
              </p>
              <p className="mt-2 h-20 text-gray-500">{plan.description}</p>
            </div>
            <div className="flex h-10 flex-col justify-center gap-2 px-8">
              {plan.current ? (
                <Button
                  variant="outline"
                  size="md"
                  fullWidth
                  disabled
                  className="rounded-full"
                >
                  {t('current')}
                </Button>
              ) : (
                <Button
                  color="primary"
                  variant="outline"
                  size="md"
                  fullWidth
                  className="rounded-full"
                  disabled={!plan.priceId}
                  onClick={() => {
                    if (plan.priceId) {
                      void initiateCheckout(plan.priceId);
                    }
                  }}
                >
                  {plan.priceId
                    ? `${t('get-started')} · $${plan.amountCents / 100}/mo`
                    : t('billing-price-not-configured')}
                </Button>
              )}
            </div>
            <ul className="mb-10 mt-5 space-y-4 px-8">
              {plan.features.map((feature) => (
                <li className="flex space-x-4" key={`${plan.id}-${feature}`}>
                  <span className="mt-0.5 text-black">✓</span>
                  <p className="text-gray-600">{feature}</p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MagilocalePricing;
