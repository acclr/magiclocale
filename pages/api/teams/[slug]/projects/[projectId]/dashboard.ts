import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import {
  getEnvironmentService,
  getTeamTranslationService,
  getVersionService,
} from '@/lib/translations';
import { translationDashboardQuerySchema, validateWithSchema } from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId, environment, page, pageSize, filter, search } =
        validateWithSchema(translationDashboardQuerySchema, req.query);
      const [dashboard, environments] = await Promise.all([
        getTeamTranslationService().dashboard(
          teamMember.team.id,
          projectId,
          environment,
          { page, pageSize, filter, search }
        ),
        getEnvironmentService().list(teamMember.team.id, projectId),
      ]);
      const status = await getVersionService().status(
        dashboard.environment.id
      );
      res.status(200).json({
        data: {
          ...dashboard,
          environments,
          publishState: {
            liveVersion: status.liveVersion,
            draft: status.draft,
            pendingCount: status.pendingCount,
            translationCount: status.diff.translationCount,
            flagCount: status.diff.flagCount,
          },
        },
      });
    },
  },
});
