import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getFlagService } from '@/lib/translations';
import {
  environmentQuerySchema,
  translationProjectParamsSchema,
  updateFlagSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const flagIdParams = translationProjectParamsSchema.extend({
  flagId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_feature_flag',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId, flagId } = validateWithSchema(flagIdParams, req.query);
      const { environment } = validateWithSchema(
        environmentQuerySchema,
        req.query
      );
      const result = await getFlagService().get(
        teamMember.team.id,
        projectId,
        flagId,
        environment
      );
      res.status(200).json({ data: result });
    },
  },
  PATCH: {
    resource: 'team_feature_flag',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, flagId } = validateWithSchema(flagIdParams, req.query);
      const patch = validateWithSchema(
        updateFlagSchema.omit({ flagId: true }),
        req.body
      );
      const flag = await getFlagService().update(
        teamMember.team.id,
        projectId,
        flagId,
        patch
      );
      res.status(200).json({ data: flag });
    },
  },
  DELETE: {
    resource: 'team_feature_flag',
    action: 'delete',
    async handle({ req, res, teamMember }) {
      const { projectId, flagId } = validateWithSchema(flagIdParams, req.query);
      await getFlagService().delete(teamMember.team.id, projectId, flagId);
      res.status(204).end();
    },
  },
});
