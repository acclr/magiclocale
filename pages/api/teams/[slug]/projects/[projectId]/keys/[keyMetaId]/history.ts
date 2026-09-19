import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import type { FlagSnapshot } from '@/domain/flags';
import type { TranslationCellSnapshot } from '@/domain/translations';
import {
  getEnvironmentService,
  getFlagService,
  getKeyCatalogService,
  getTeamTranslationService,
  getVersionService,
} from '@/lib/translations';
import {
  environmentQuerySchema,
  restoreKeyChangeSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';
import { z } from 'zod';

const params = translationProjectParamsSchema.extend({
  keyMetaId: z.string().uuid(),
});

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_version',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId, keyMetaId } = validateWithSchema(params, req.query);
      const { environment } = validateWithSchema(
        environmentQuerySchema,
        req.query
      );
      const { meta } = await getKeyCatalogService().get(
        teamMember.team.id,
        projectId,
        keyMetaId
      );
      const env = await getEnvironmentService().resolve(projectId, environment);
      const changes = await getVersionService().listChangesForKey(
        env.id,
        meta.type === 'feature-flag' ? 'flag' : 'translation',
        meta.key
      );
      res.status(200).json({ data: changes });
    },
  },
  POST: {
    resource: 'team_translation',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId, keyMetaId } = validateWithSchema(params, req.query);
      const { environment } = validateWithSchema(
        environmentQuerySchema,
        req.query
      );
      const { changeId } = validateWithSchema(restoreKeyChangeSchema, req.body);
      const { meta } = await getKeyCatalogService().get(
        teamMember.team.id,
        projectId,
        keyMetaId
      );
      const env = await getEnvironmentService().resolve(projectId, environment);
      const entityType = meta.type === 'feature-flag' ? 'flag' : 'translation';
      const changes = await getVersionService().listChangesForKey(
        env.id,
        entityType,
        meta.key
      );
      const change = changes.find((item) => item.id === changeId);
      if (!change) {
        return res.status(404).json({ error: { message: 'Change not found' } });
      }

      const reason = change.reason ?? 'Restored from history';

      if (entityType === 'translation') {
        const after = change.after as TranslationCellSnapshot | null;
        if (!change.locale || !after) {
          return res.status(422).json({
            error: { message: 'This change has no value to restore' },
          });
        }
        const translation = await getTeamTranslationService().saveManualByKey(
          teamMember.team.id,
          projectId,
          env.slug,
          meta.key,
          change.locale,
          after.value,
          teamMember.user.email
        );
        return res.status(200).json({ data: translation });
      }

      const after = change.after as FlagSnapshot | null;
      if (!after) {
        return res.status(422).json({
          error: { message: 'This change has no value to restore' },
        });
      }
      const { flags } = await getFlagService().list(
        teamMember.team.id,
        projectId,
        env.slug
      );
      const item = flags.find((entry) => entry.flag.key === meta.key);
      if (!item) {
        return res.status(404).json({ error: { message: 'Flag not found' } });
      }
      const restored = await getFlagService().setConfig(
        teamMember.team.id,
        projectId,
        item.flag.id,
        env.slug,
        {
          enabled: after.enabled,
          defaultValue: after.defaultValue,
          offValue: after.offValue,
          rolloutPercentage: after.rolloutPercentage,
          inherited: false,
        },
        teamMember.user.email,
        reason
      );
      await getFlagService().setRules(
        teamMember.team.id,
        projectId,
        item.flag.id,
        env.slug,
        after.rules,
        teamMember.user.email,
        reason
      );
      return res.status(200).json({ data: restored });
    },
  },
});
