import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getFlagService } from '@/lib/translations';
import {
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_feature_flag',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const data = await getFlagService().matrix(
        teamMember.team.id,
        projectId
      );
      res.status(200).json({ data });
    },
  },
});
