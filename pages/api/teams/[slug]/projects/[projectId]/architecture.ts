import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getArchitectureService } from '@/lib/translations';
import {
  architectureRuleSchema,
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
      const service = getArchitectureService();
      const [health, explorer, rules, findings] = await Promise.all([
        service.health(teamMember.team.id, projectId),
        service.explorer(teamMember.team.id, projectId),
        service.getRules(teamMember.team.id, projectId),
        service.listFindings(teamMember.team.id, projectId, 'open'),
      ]);
      res.status(200).json({ data: { health, explorer, rules, findings } });
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
      if (req.body?.analyze) {
        const findings = await getArchitectureService().analyze(
          teamMember.team.id,
          projectId
        );
        return res.status(200).json({ data: findings });
      }
      const config = validateWithSchema(architectureRuleSchema, req.body);
      const rule = await getArchitectureService().saveRules(
        teamMember.team.id,
        projectId,
        config
      );
      res.status(200).json({ data: rule });
    },
  },
});
