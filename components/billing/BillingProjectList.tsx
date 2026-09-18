import Link from 'next/link';
import { useTranslation } from '@/hooks/useTranslation';

import type { BillingScope, LocaleKitEntitlement } from '@/domain/billing';

export type BilledProjectSummary = {
  id: string;
  name: string;
  billingScope: BillingScope;
  entitlement: LocaleKitEntitlement;
};

const BillingProjectList = ({
  slug,
  projects,
}: {
  slug: string;
  projects: BilledProjectSummary[];
}) => {
  const { t } = useTranslation('common');
  const teamCovered = projects.filter(
    (project) => project.billingScope === 'team'
  );
  const projectBilled = projects.filter(
    (project) => project.billingScope === 'project'
  );

  if (!projects.length) {
    return null;
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h2 className="card-title text-xl font-medium leading-none tracking-tight">
          {t('team-retainer-projects')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('team-retainer-projects-help')}
        </p>
        <ProjectTable
          empty={t('no-team-retainer-projects')}
          projects={teamCovered}
          slug={slug}
        />
      </section>
      <section className="space-y-3">
        <h2 className="card-title text-xl font-medium leading-none tracking-tight">
          {t('project-billed-projects')}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t('project-billed-projects-help')}
        </p>
        <ProjectTable
          empty={t('no-project-billed-projects')}
          projects={projectBilled}
          slug={slug}
        />
      </section>
    </div>
  );
};

function ProjectTable({
  empty,
  projects,
  slug,
}: {
  empty: string;
  projects: BilledProjectSummary[];
  slug: string;
}) {
  const { t } = useTranslation('common');

  if (!projects.length) {
    return <p className="text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <table className="table w-full border text-sm">
      <thead>
        <tr>
          <th>{t('translation-project-name')}</th>
          <th>{t('plan')}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {projects.map((project) => (
          <tr key={project.id}>
            <td>{project.name}</td>
            <td>
              {project.entitlement.plan.name}
              {project.entitlement.subscribed
                ? ''
                : ` (${t('plan-not-subscribed')})`}
            </td>
            <td className="text-right">
              <Link
                className="link link-hover text-sm"
                href={`/teams/${slug}/projects/${project.id}/settings`}
              >
                {t('project-settings')}
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default BillingProjectList;
