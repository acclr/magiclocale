import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import {
  retranslateLocalesSchema,
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
      const { locales, sourceLocale } = validateWithSchema(
        retranslateLocalesSchema,
        req.body
      );
      const result = await getTeamTranslationService().retranslate(
        teamMember.team.id,
        projectId,
        locales,
        sourceLocale
      );
      res.status(200).json({ data: result });
    },
  },
});
