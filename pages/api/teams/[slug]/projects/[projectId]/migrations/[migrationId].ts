import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getMigrationService } from '@/lib/translations';
import { translationProjectParamsSchema, validateWithSchema } from '@/lib/zod';
import { z } from 'zod';

const params = translationProjectParamsSchema.extend({
  migrationId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId, migrationId } = validateWithSchema(params, req.query);
      const migration = await getMigrationService().get(
        teamMember.team.id,
        projectId,
        migrationId
      );
      res.status(200).json({
        data: {
          migration,
          cli: getMigrationService().exportForCli(migration),
        },
      });
    },
  },
  POST: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, migrationId } = validateWithSchema(params, req.query);
      const data = await getMigrationService().apply(
        teamMember.team.id,
        projectId,
        migrationId
      );
      res.status(200).json({ data });
    },
  },
});
