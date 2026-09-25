import { flattenTranslationJson } from '@/domain/migrations';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { enforceSourceKeyCapacity } from '@/lib/billing/enforce-limits';
import { getProjectEntitlement } from '@/lib/billing/entitlement';
import {
  getEnvironmentService,
  getProjectService,
  getTranslationService,
} from '@/lib/translations';
import {
  environmentQuerySchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { environment } = validateWithSchema(
        environmentQuerySchema,
        req.body ?? {}
      );
      const keys = flattenTranslationJson(req.body?.translations ?? req.body);
      if (!keys.length) {
        return res.status(422).json({
          error: {
            code: 422,
            message: 'No translation keys found in JSON.',
            values: {},
          },
        });
      }
      const env = await getEnvironmentService().resolve(projectId, environment);
      await getEnvironmentService().get(teamMember.team.id, projectId, env.id);
      const project = await getProjectService().get(
        teamMember.team.id,
        projectId
      );
      const entitlement = await getProjectEntitlement(
        project,
        teamMember.team.billingId
      );
      await enforceSourceKeyCapacity(
        projectId,
        entitlement,
        keys.map((item) => item.key)
      );
      const data = await getTranslationService().syncFromSource(
        projectId,
        env.id,
        keys
      );
      res.status(200).json({ data });
    },
  },
});
