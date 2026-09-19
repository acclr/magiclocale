import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getFlagService } from '@/lib/translations';
import {
  promoteFlagSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const params = translationProjectParamsSchema.extend({
  flagId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_feature_flag',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, flagId } = validateWithSchema(params, req.query);
      const input = validateWithSchema(promoteFlagSchema, req.body);
      const data = await getFlagService().promoteConfig(
        teamMember.team.id,
        projectId,
        flagId,
        input.sourceEnvironment,
        input.targetEnvironment,
        teamMember.user.email,
        input.reason
      );
      res.status(200).json({ data });
    },
  },
});
