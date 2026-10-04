import { paginateTranslationDashboard } from '@/domain/translations';
import { readThrough } from '@/lib/cache/read-through';
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
      const cacheKey = [
        'dashboard',
        projectId,
        teamMember.team.id,
        environment ?? '',
        complete ?? '',
        String(page ?? ''),
        String(pageSize ?? ''),
        filter ?? '',
        search ?? '',
      ].join(':');
      const data = await readThrough(cacheKey, async () => {
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
        return {
          ...dashboard,
          environments,
          publishState: {
            liveVersion: status.liveVersion,
            draft: status.draft,
            pendingCount: status.pendingCount,
            translationCount: status.diff.translationCount,
            flagCount: status.diff.flagCount,
          },
        };
      });
      res.status(200).json({ data });
    },
  },
});
