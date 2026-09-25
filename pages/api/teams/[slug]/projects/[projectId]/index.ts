import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getProjectService } from '@/lib/translations';
import { invalidateProjectCorsCache } from '@/lib/api/public-sdk-cors';
import {
  updateTranslationProjectSchema,
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
      const patch = validateWithSchema(
        updateTranslationProjectSchema,
        req.body
      );
      const id = projectId(req.query);
      let project = await getProjectService().get(teamMember.team.id, id);
      if (patch.name !== undefined) {
        project = await getProjectService().rename(
          teamMember.team.id,
          id,
          patch.name
        );
      }
      if (patch.allowedOrigins !== undefined) {
        project = await getProjectService().setAllowedOrigins(
          teamMember.team.id,
          id,
          patch.allowedOrigins
        );
        invalidateProjectCorsCache(id);
      }
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
