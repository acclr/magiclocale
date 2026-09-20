import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import {
  queueTranslationsSchema,
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
      const body = validateWithSchema(queueTranslationsSchema, req.body);
      const result = await getTeamTranslationService().queueTranslations(
        teamMember.team.id,
        projectId,
        environment,
        body
      );
      res.status(200).json({ data: result });
    },
  },
});
