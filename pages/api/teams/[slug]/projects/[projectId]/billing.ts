import { customerIdForScope } from '@/domain/billing';
import { getBillingCatalog } from '@/lib/billing/catalog';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getProjectService } from '@/lib/translations';
import {
  projectBillingScopeSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

function projectIdFrom(query: unknown): string {
  return validateWithSchema(translationProjectParamsSchema, query).projectId;
}

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation_project',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const project = await getProjectService().get(
        teamMember.team.id,
        projectIdFrom(req.query)
      );
      const catalog = await getBillingCatalog(
        customerIdForScope(
          project.billingScope,
          teamMember.team.billingId,
          project.billingId
        ),
        project.billingScope
      );
      res.status(200).json({
        data: {
          ...catalog,
          billingScope: project.billingScope,
          hasBillingCustomer: Boolean(project.billingId),
          projectId: project.id,
        },
      });
    },
  },
  PATCH: {
    resource: 'team_payments',
    action: 'create',
    async handle({ req, res, teamMember }) {
      const projectId = projectIdFrom(req.query);
      const { billingScope } = validateWithSchema(
        projectBillingScopeSchema,
        req.body
      );
      const project = await getProjectService().setBillingScope(
        teamMember.team.id,
        projectId,
        billingScope
      );
      const catalog = await getBillingCatalog(
        customerIdForScope(
          project.billingScope,
          teamMember.team.billingId,
          project.billingId
        ),
        project.billingScope
      );
      res.status(200).json({
        data: {
          ...catalog,
          billingScope: project.billingScope,
          hasBillingCustomer: Boolean(project.billingId),
          projectId: project.id,
          project,
        },
      });
    },
  },
});
