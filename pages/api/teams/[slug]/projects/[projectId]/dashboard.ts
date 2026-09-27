import { paginateTranslationDashboard } from '@/domain/translations';
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
      const { projectId, environment, page, pageSize, filter, search, complete } =
        validateWithSchema(translationDashboardQuerySchema, req.query);
      const [loaded, environments] = await Promise.all([
        getTeamTranslationService().loadDashboard(
          teamMember.team.id,
          projectId,
          environment
        ),
        getEnvironmentService().list(teamMember.team.id, projectId),
      ]);
      const status = await getVersionService().statusFromParts(
        loaded.environment,
        loaded.project,
        loaded.keys,
        loaded.translations
      );
      const dashboard = complete
        ? loaded.dashboard
        : paginateTranslationDashboard(loaded.dashboard, {
            page,
            pageSize,
            filter,
            search,
          });
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
