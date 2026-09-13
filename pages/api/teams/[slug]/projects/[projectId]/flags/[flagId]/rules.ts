import type { FlagRuleInput, FlagValue } from '@/domain/flags';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getFlagService } from '@/lib/translations';
import {
  flagRulesSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const flagIdParams = translationProjectParamsSchema.extend({
  flagId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  PUT: {
    resource: 'team_feature_flag',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, flagId } = validateWithSchema(flagIdParams, req.query);
      const { environment, rules } = validateWithSchema(
        flagRulesSchema.omit({ flagId: true }),
        req.body
      );
      const result = await getFlagService().setRules(
        teamMember.team.id,
        projectId,
        flagId,
        environment,
        rules.map((rule) => ({
          ...rule,
          value: rule.value as FlagValue,
        })) as FlagRuleInput[],
        teamMember.user.email
      );
      res.status(200).json({ data: result });
    },
  },
});
