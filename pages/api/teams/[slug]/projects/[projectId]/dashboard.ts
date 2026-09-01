import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import { translationProjectParamsSchema, validateWithSchema } from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const dashboard = await getTeamTranslationService().dashboard(
        teamMember.team.id,
        projectId
      );
      res.status(200).json({ data: dashboard });
    },
  },
});
