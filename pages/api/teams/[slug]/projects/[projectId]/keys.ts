import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getKeyCatalogService } from '@/lib/translations';
import {
  keyCatalogQuerySchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const query = validateWithSchema(keyCatalogQuerySchema, req.query);
      const data = await getKeyCatalogService().list(
        teamMember.team.id,
        query.projectId,
        query
      );
      res.status(200).json({ data });
    },
  },
});
