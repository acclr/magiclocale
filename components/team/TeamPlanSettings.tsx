import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';
import useSWR from 'swr';

import fetcher from '@/lib/fetcher';
import type { KeykitEntitlement } from '@/domain/billing';
import type { ApiResponse } from 'types';
import { Card } from '@/components/shared';

const TeamPlanSettings = ({ slug }: { slug: string }) => {
  const { t } = useTranslation('common');
  const { data } = useSWR<ApiResponse<KeykitEntitlement>>(
    slug ? `/api/teams/${slug}/billing/entitlement` : null,
    fetcher
  );
  const entitlement = data?.data;

  return (
    <Card>
      <Card.Body>
        <Card.Header>
          <Card.Title>{t('keykit-plan')}</Card.Title>
          <Card.Description>{t('keykit-plan-description')}</Card.Description>
        </Card.Header>
        {entitlement ? (
          <div className="space-y-2 text-sm">
            <p>
              <span className="font-medium">{t('current')}: </span>
              {entitlement.plan.name}
              {entitlement.planId !== 'free' && !entitlement.subscribed
                ? ` (${t('plan-not-subscribed')})`
                : ''}
            </p>
            <p>
              {entitlement.maxTeamMembers
                ? t('plan-member-limit', {
                    count: entitlement.maxTeamMembers,
                  })
                : t('plan-member-unlimited')}
            </p>
            <p>
              {entitlement.maxLocales
                ? t('plan-language-limit', { count: entitlement.maxLocales })
                : t('plan-language-unlimited')}
            </p>
            <p className="text-muted-foreground">
              {t('team-retainer-settings-help')}
            </p>
            <Link
              className="btn btn-outline btn-sm mt-2"
              href={`/teams/${slug}/billing`}
            >
              {t('manage-subscription')}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t('loading')}</p>
        )}
      </Card.Body>
    </Card>
  );
};

export default TeamPlanSettings;
