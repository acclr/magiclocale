import { validateVariables } from '@/domain/keys';
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
      const dashboard = await getTeamTranslationService().dashboard(
        teamMember.team.id,
        projectId,
        environment,
        { page: 1, pageSize: 1, search: '' }
      );
      const row = dashboard.rows.find((item) => item.keyId === keyId);
      const issues = row ? validateVariables(row.sourceText, value) : [];
      res.status(200).json({ data: translation, issues });
    },
  },
});
