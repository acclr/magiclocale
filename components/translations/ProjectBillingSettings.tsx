import MagilocalePricing from '@/components/billing/MagilocalePricing';
import MagilocaleSubscriptions from '@/components/billing/MagilocaleSubscriptions';
import LinkToPortal from '@/components/billing/LinkToPortal';
import { Card } from '@/components/shared';
import { defaultHeaders } from '@/lib/common';
import fetcher from '@/lib/fetcher';
import type {
  BillingScope,
  MagilocaleEntitlement,
  MagilocalePlan,
} from '@/domain/billing';
import type { ApiResponse } from 'types';
import useCanAccess from 'hooks/useCanAccess';
import useTeam from 'hooks/useTeam';
import { useTranslation } from 'next-i18next';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useSWR from 'swr';

type CatalogPlan = MagilocalePlan & {
  priceId: string | null;
  current: boolean;
};

type ProjectBillingResponse = {
  billingScope: BillingScope;
  hasBillingCustomer: boolean;
  projectId: string;
  entitlement: MagilocaleEntitlement;
  plans: CatalogPlan[];
  subscriptions: Array<{
    id: string;
    planName: string;
    startDate: string;
    endDate: string;
  }>;
};

type ProjectBillingSettingsProps = {
  slug: string;
  projectId: string;
  onScopeChanged?: () => Promise<unknown>;
};

const ProjectBillingSettings = ({
  slug,
  projectId,
  onScopeChanged,
}: ProjectBillingSettingsProps) => {
  const { t } = useTranslation('common');
  const { team } = useTeam();
  const { canAccess } = useCanAccess();
  const canBill = canAccess('team_payments', ['create']);
  const { data, isLoading, mutate } = useSWR<
    ApiResponse<ProjectBillingResponse>
  >(
    slug && projectId
      ? `/api/teams/${slug}/projects/${projectId}/billing`
      : null,
    fetcher
  );
  const [isSaving, setIsSaving] = useState(false);
  const billing = data?.data;

  const setScope = async (billingScope: BillingScope) => {
    if (!canBill || billing?.billingScope === billingScope) {
      return;
    }
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/teams/${slug}/projects/${projectId}/billing`,
        {
          method: 'PATCH',
          headers: defaultHeaders,
          body: JSON.stringify({ billingScope }),
        }
      );
      const json =
        (await response.json()) as ApiResponse<ProjectBillingResponse>;
      if (!response.ok) {
        throw new Error(json.error.message);
      }
      await mutate(json, false);
      await onScopeChanged?.();
      toast.success(t('billing-scope-updated'));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('error-500'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <Card.Body>
          <Card.Header>
            <Card.Title>{t('project-billing')}</Card.Title>
            <Card.Description>
              {t('project-billing-description')}
            </Card.Description>
          </Card.Header>
          {isLoading || !billing ? (
            <p className="text-sm text-base-content/60">{t('loading')}</p>
          ) : (
            <div className="space-y-4">
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-base-300 p-3">
                <input
                  checked={billing.billingScope === 'team'}
                  className="radio radio-sm mt-1"
                  disabled={!canBill || isSaving}
                  name="billingScope"
                  onChange={() => void setScope('team')}
                  type="radio"
                />
                <span>
                  <span className="block font-medium">
                    {t('billing-scope-team')}
                  </span>
                  <span className="text-sm text-base-content/60">
                    {t('billing-scope-team-help')}
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-md border border-base-300 p-3">
                <input
                  checked={billing.billingScope === 'project'}
                  className="radio radio-sm mt-1"
                  disabled={!canBill || isSaving}
                  name="billingScope"
                  onChange={() => void setScope('project')}
                  type="radio"
                />
                <span>
                  <span className="block font-medium">
                    {t('billing-scope-project')}
                  </span>
                  <span className="text-sm text-base-content/60">
                    {t('billing-scope-project-help')}
                  </span>
                </span>
              </label>
              <p className="text-sm">
                <span className="font-medium">{t('current')}: </span>
                {billing.entitlement.plan.name}
                {billing.entitlement.subscribed
                  ? ''
                  : ` (${t('plan-not-subscribed')})`}
              </p>
            </div>
          )}
        </Card.Body>
      </Card>

      {billing?.billingScope === 'project' && (
        <>
          {team && billing.hasBillingCustomer && canBill && (
            <LinkToPortal projectId={projectId} team={team} />
          )}
          {billing.subscriptions.length > 0 && (
            <MagilocaleSubscriptions subscriptions={billing.subscriptions} />
          )}
          {canBill && (
            <MagilocalePricing plans={billing.plans} projectId={projectId} />
          )}
        </>
      )}
    </div>
  );
};

export default ProjectBillingSettings;
