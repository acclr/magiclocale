import { validateVariables } from '@/domain/keys';
import { invalidateProjectReads } from '@/lib/cache/read-through';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService, getTranslationRepository } from '@/lib/translations';
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
      invalidateProjectReads(projectId);
      const key = await getTranslationRepository().getKey(keyId);
      const issues =
        key && key.projectId === projectId
          ? validateVariables(key.sourceText, value)
          : [];
      res.status(200).json({ data: translation, issues });
    },
  },
});
