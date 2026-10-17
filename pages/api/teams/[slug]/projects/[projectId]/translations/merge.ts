import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import {
  mergeKeysSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, environment } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const body = validateWithSchema(mergeKeysSchema, req.body);
      const result = await getTeamTranslationService().mergeKeys(
        teamMember.team.id,
        projectId,
        environment,
        {
          sourceKeys: body.sourceKeys,
          targetKey: body.targetKey,
          sourceText: body.sourceText,
          actor: teamMember.userId,
        }
      );
      res.status(200).json({ data: result });
    },
  },
});
