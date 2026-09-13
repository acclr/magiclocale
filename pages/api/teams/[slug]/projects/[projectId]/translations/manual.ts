import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import {
  saveManualTranslationSchema,
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
      const { keyId, locale, value } = validateWithSchema(
        saveManualTranslationSchema,
        req.body
      );
      const translation = await getTeamTranslationService().saveManual(
        teamMember.team.id,
        projectId,
        environment,
        keyId,
        locale,
        value,
        teamMember.user.email
      );
      res.status(200).json({ data: translation });
    },
  },
});
