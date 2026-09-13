import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getEnvironmentService, getVersionService } from '@/lib/translations';
import {
  environmentQuerySchema,
  translationProjectParamsSchema,
  validateWithSchema,
  versionHistoryQuerySchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_version',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const query = validateWithSchema(
        environmentQuerySchema.merge(
          versionHistoryQuerySchema.pick({ versionId: true, limit: true })
        ),
        req.query
      );
      const environment = await getEnvironmentService().resolve(
        projectId,
        query.environment
      );
      await getEnvironmentService().requireProjectEnvironment(
        projectId,
        environment.id
      );
      const teamId = teamMember.team.id;
      await getEnvironmentService().get(teamId, projectId, environment.id);

      const versionService = getVersionService();
      const [versions, status] = await Promise.all([
        versionService.listVersions(environment.id, query.limit),
        versionService.status(environment.id),
      ]);

      const versionId = query.versionId ?? status.draft?.id;
      const changes = versionId
        ? await versionService.listChanges(versionId)
        : [];

      res.status(200).json({
        data: {
          environment,
          versions,
          status: {
            liveVersion: status.liveVersion,
            draft: status.draft,
            pendingCount: status.pendingCount,
            diff: status.diff,
          },
          changes,
        },
      });
    },
  },
});
