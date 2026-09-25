import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import {
  getArchitectureService,
  getMigrationService,
} from '@/lib/translations';
import {
  findingActionSchema,
  translationProjectParamsSchema,
  updateFindingSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const params = translationProjectParamsSchema.extend({
  findingId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  PATCH: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, findingId } = validateWithSchema(params, req.query);
      const { status } = validateWithSchema(updateFindingSchema, req.body);
      const data = await getArchitectureService().updateFinding(
        teamMember.team.id,
        projectId,
        findingId,
        status
      );
      res.status(200).json({ data });
    },
  },
  POST: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, findingId } = validateWithSchema(params, req.query);
      validateWithSchema(
        findingActionSchema,
        req.body ?? { action: 'cleanup' }
      );
      const { finding, meta, operation } =
        await getArchitectureService().cleanupOperations(
          teamMember.team.id,
          projectId,
          findingId
        );
      const migration = await getMigrationService().create(
        teamMember.team.id,
        projectId,
        `Cleanup ${meta.key}`,
        [operation],
        teamMember.user.email
      );
      res.status(201).json({ data: { finding, migration } });
    },
  },
});
