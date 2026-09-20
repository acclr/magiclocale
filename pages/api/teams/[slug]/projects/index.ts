import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { enforceProjectLimit } from '@/lib/billing/enforce-limits';
import { getProjectService } from '@/lib/translations';
import { createTranslationProjectSchema, validateWithSchema } from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation_project',
    action: 'read',
    async handle({ res, teamMember }) {
      const projects = await getProjectService().list(teamMember.team.id);
      res.status(200).json({ data: projects });
    },
  },
  POST: {
    resource: 'team_translation_project',
    action: 'create',
    async handle({ req, res, teamMember }) {
      const input = validateWithSchema(
        createTranslationProjectSchema,
        req.body
      );
      const existing = await getProjectService().list(teamMember.team.id);
      await enforceProjectLimit(
        teamMember.team.id,
        teamMember.team.billingId,
        existing.length
      );
      const project = await getProjectService().create(
        teamMember.team.id,
        input
      );
      res.status(201).json({ data: project });
    },
  },
});
