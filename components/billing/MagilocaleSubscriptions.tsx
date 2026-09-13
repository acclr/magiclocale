import { useTranslation } from '@/hooks/useTranslation';

type BillingSubscription = {
  id: string;
  planName: string;
  startDate: string;
  endDate: string;
};

const MagilocaleSubscriptions = ({
  subscriptions,
}: {
  subscriptions: BillingSubscription[];
}) => {
  const { t } = useTranslation('common');

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h2 className="card-title text-xl font-medium leading-none tracking-tight">
        {t('subscriptions')}
      </h2>
      <table className="table w-full border text-sm">
        <thead>
          <tr>
            <th>{t('plan')}</th>
            <th>{t('start-date')}</th>
            <th>{t('end-date')}</th>
          </tr>
        </thead>
        <tbody>
          {subscriptions.map((subscription) => (
            <tr key={subscription.id}>
              <td>{subscription.planName}</td>
              <td>{new Date(subscription.startDate).toLocaleDateString()}</td>
              <td>{new Date(subscription.endDate).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MagilocaleSubscriptions;
