import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getMigrationService } from '@/lib/translations';
import {
  createMigrationSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const data = await getMigrationService().list(
        teamMember.team.id,
        projectId
      );
      res.status(200).json({ data });
    },
  },
  POST: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const input = validateWithSchema(createMigrationSchema, req.body);
      const data = await getMigrationService().create(
        teamMember.team.id,
        projectId,
        input.name,
        input.operations,
        teamMember.user.email
      );
      res.status(201).json({ data });
    },
  },
});
