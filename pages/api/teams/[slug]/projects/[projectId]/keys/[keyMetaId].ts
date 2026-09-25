import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import {
  getKeyCatalogService,
  getTeamTranslationService,
} from '@/lib/translations';
import {
  translationProjectParamsSchema,
  updateKeyMetaSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const params = translationProjectParamsSchema.extend({
  keyMetaId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_translation',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId, keyMetaId } = validateWithSchema(params, req.query);
      const data = await getKeyCatalogService().get(
        teamMember.team.id,
        projectId,
        keyMetaId
      );
      const translationKey =
        data.meta.type === 'translation'
          ? await getTeamTranslationService().getKeyByName(
              teamMember.team.id,
              projectId,
              data.meta.key
            )
          : null;
      res.status(200).json({
        data: { ...data, sourceText: translationKey?.sourceText ?? null },
      });
    },
  },
  PATCH: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, keyMetaId } = validateWithSchema(params, req.query);
      const patch = validateWithSchema(updateKeyMetaSchema, req.body);
      const meta = await getKeyCatalogService().update(
        teamMember.team.id,
        projectId,
        keyMetaId,
        {
          ...patch,
          reviewAt:
            patch.reviewAt === undefined
              ? undefined
              : patch.reviewAt
                ? new Date(patch.reviewAt)
                : null,
        }
      );
      res.status(200).json({ data: meta });
    },
  },
});
