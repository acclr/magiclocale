import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import {
  markTranslationReviewedSchema,
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
      const { translationId } = validateWithSchema(
        markTranslationReviewedSchema,
        req.body
      );
      const translation = await getTeamTranslationService().markReviewed(
        teamMember.team.id,
        projectId,
        translationId,
        teamMember.user.email
      );
      res.status(200).json({ data: translation });
    },
  },
});
