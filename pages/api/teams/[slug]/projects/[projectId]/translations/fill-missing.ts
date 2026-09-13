import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import {
  translationLocaleSchema,
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
      const { locale } = validateWithSchema(translationLocaleSchema, req.body);
      const result = await getTeamTranslationService().fillMissing(
        teamMember.team.id,
        projectId,
        environment,
        locale
      );
      res.status(200).json({ data: result });
    },
  },
});
