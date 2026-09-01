import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getProjectService } from '@/lib/translations';
import {
  renameTranslationProjectSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

function projectId(query: unknown): string {
  return validateWithSchema(translationProjectParamsSchema, query).projectId;
}

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation_project',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const project = await getProjectService().get(
        teamMember.team.id,
        projectId(req.query)
      );
      res.status(200).json({ data: project });
    },
  },
  PATCH: {
    resource: 'team_translation_project',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { name } = validateWithSchema(
        renameTranslationProjectSchema,
        req.body
      );
      const project = await getProjectService().rename(
        teamMember.team.id,
        projectId(req.query),
        name
      );
      res.status(200).json({ data: project });
    },
  },
  DELETE: {
    resource: 'team_translation_project',
    action: 'delete',
    async handle({ req, res, teamMember }) {
      await getProjectService().delete(
        teamMember.team.id,
        projectId(req.query)
      );
      res.status(204).end();
    },
  },
});
