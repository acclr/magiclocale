import type { FlagValue } from '@/domain/flags';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getFlagService } from '@/lib/translations';
import {
  flagConfigSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const flagIdParams = translationProjectParamsSchema.extend({
  flagId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  PATCH: {
    resource: 'team_feature_flag',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, flagId } = validateWithSchema(flagIdParams, req.query);
      const { environment, reason, ...patch } = validateWithSchema(
        flagConfigSchema.omit({ flagId: true }),
        req.body
      );
      const result = await getFlagService().setConfig(
        teamMember.team.id,
        projectId,
        flagId,
        environment,
        {
          ...patch,
          defaultValue: patch.defaultValue as FlagValue | undefined,
          offValue: patch.offValue as FlagValue | undefined,
        },
        teamMember.user.email,
        reason
      );
      res.status(200).json({ data: result });
    },
  },
});
