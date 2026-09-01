import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getTeamTranslationService } from '@/lib/translations';
import { translationDashboardQuerySchema, validateWithSchema } from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId, page, pageSize, filter, search } = validateWithSchema(
        translationDashboardQuerySchema,
        req.query
      );
      const dashboard = await getTeamTranslationService().dashboard(
        teamMember.team.id,
        projectId,
        { page, pageSize, filter, search }
      );
      res.status(200).json({ data: dashboard });
    },
  },
});
