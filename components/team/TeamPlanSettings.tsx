import Link from 'next/link';
import { useTranslation } from 'next-i18next';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { MagilocaleEntitlement } from '@/domain/billing';
import type { ApiResponse } from 'types';
import { Card } from '@/components/shared';

const TeamPlanSettings = ({ slug }: { slug: string }) => {
  const { t } = useTranslation('common');
  const { data } = useSWR<ApiResponse<MagilocaleEntitlement>>(
    slug ? `/api/teams/${slug}/billing/entitlement` : null,
    fetcher
  );
  const entitlement = data?.data;

  return (
    <Card>
      <Card.Body>
        <Card.Header>
          <Card.Title>{t('magilocale-plan')}</Card.Title>
          <Card.Description>
            {t('magilocale-plan-description')}
          </Card.Description>
        </Card.Header>
        {entitlement ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">{t('current')}: </span>
              {entitlement.plan.name}
              {entitlement.subscribed ? '' : ` (${t('plan-not-subscribed')})`}
            </p>
            <p>
              {entitlement.maxLocales
                ? t('plan-language-limit', { count: entitlement.maxLocales })
                : t('plan-language-unlimited')}
            </p>
            <Link
              className="btn btn-outline btn-sm mt-2"
              href={`/teams/${slug}/billing`}
            >
              {t('manage-subscription')}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-base-content/60">{t('loading')}</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default TeamPlanSettings;
