import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getProjectEntitlement } from '@/lib/billing/entitlement';
import { ApiError } from '@/lib/errors';
import {
  getProjectService,
  getTeamTranslationService,
} from '@/lib/translations';
import { canAddProjectLocale, localeLimitMessage } from '@/domain/billing';
import {
  translationLocaleSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_translation_project',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, environment } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { locale } = validateWithSchema(translationLocaleSchema, req.body);
      const project = await getProjectService().get(
        teamMember.team.id,
        projectId
      );
      if (!project.locales.includes(locale)) {
        const entitlement = await getProjectEntitlement(
          project,
          teamMember.team.billingId
        );
        if (
          !canAddProjectLocale(project.locales.length, entitlement.maxLocales)
        ) {
          throw new ApiError(
            402,
            localeLimitMessage(entitlement.maxLocales ?? 4)
          );
        }
      }

      const result = await getTeamTranslationService().addLocaleAndFill(
        teamMember.team.id,
        projectId,
        environment,
        locale
      );
      res.status(200).json({ data: result });
    },
  },
  DELETE: {
    resource: 'team_translation_project',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { locale } = validateWithSchema(translationLocaleSchema, req.body);
      const project = await getProjectService().removeLocale(
        teamMember.team.id,
        projectId,
        locale
      );
      res.status(200).json({ data: project });
    },
  },
});
