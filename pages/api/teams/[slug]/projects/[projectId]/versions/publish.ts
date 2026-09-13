import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import {
  getEnvironmentService,
  getVersionService,
} from '@/lib/translations';
import { notifyVersionPublished } from '@/lib/versions/notify';
import { publishVersionSchema, validateWithSchema } from '@/lib/zod';
import { translationProjectParamsSchema } from '@/lib/zod';

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_version',
    action: 'publish',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { environment: environmentRef, message } = validateWithSchema(
        publishVersionSchema,
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

      const result = await getVersionService().publish(environment.id, {
        message,
        actor: teamMember.user.email,
      });

      await notifyVersionPublished({
        user: teamMember.user,
        team: teamMember.team,
        projectId,
        environment,
        result,
      });

      res.status(200).json({ data: { environment, ...result } });
    },
  },
});
