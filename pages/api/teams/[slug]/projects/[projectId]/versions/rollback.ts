import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getEnvironmentService, getVersionService } from '@/lib/translations';
import { notifyVersionRolledBack } from '@/lib/versions/notify';
import {
  rollbackVersionSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_version',
    action: 'publish',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { environment: environmentRef, versionId } = validateWithSchema(
        rollbackVersionSchema,
        req.body
      );
      const environment = await getEnvironmentService().resolve(
        projectId,
        environmentRef
      );
      await getEnvironmentService().get(
        teamMember.team.id,
        projectId,
        environment.id
      );

      const version = await getVersionService().rollback(
        environment.id,
        versionId
      );

      await notifyVersionRolledBack({
        user: teamMember.user,
        team: teamMember.team,
        projectId,
        environment,
        version,
      });

      res.status(200).json({ data: { environment, version } });
    },
  },
});
