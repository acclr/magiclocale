import { canAddFlag, flagLimitMessage } from '@/domain/billing';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getProjectEntitlement } from '@/lib/billing/entitlement';
import { ApiError } from '@/lib/errors';
import { getFlagService, getProjectService } from '@/lib/translations';
import {
  createFlagSchema,
  deleteFlagSchema,
  environmentQuerySchema,
  translationProjectParamsSchema,
  updateFlagSchema,
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
      const { environment } = validateWithSchema(
        environmentQuerySchema,
        req.query
      );
      const result = await getFlagService().list(
        teamMember.team.id,
        projectId,
        environment
      );
      res.status(200).json({ data: result });
    },
  },
  POST: {
    resource: 'team_feature_flag',
    action: 'create',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const input = validateWithSchema(createFlagSchema, req.body);
      const project = await getProjectService().get(
        teamMember.team.id,
        projectId
      );
      const entitlement = await getProjectEntitlement(
        project,
        teamMember.team.billingId
      );
      const count = await getFlagService().countForProject(project.id);
      if (!canAddFlag(count, entitlement.maxFlags)) {
        throw new ApiError(402, flagLimitMessage(entitlement.maxFlags ?? 25));
      }

      const flag = await getFlagService().create(
        teamMember.team.id,
        projectId,
        {
          key: input.key,
          name: input.name ?? input.key,
          description: input.description,
          type: input.type,
          visibility: input.visibility,
        },
        { maxFlags: entitlement.maxFlags }
      );
      res.status(201).json({ data: flag });
    },
  },
  PATCH: {
    resource: 'team_feature_flag',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { flagId, ...patch } = validateWithSchema(
        updateFlagSchema,
        req.body
      );
      const flag = await getFlagService().update(
        teamMember.team.id,
        projectId,
        flagId,
        patch
      );
      res.status(200).json({ data: flag });
    },
  },
  DELETE: {
    resource: 'team_feature_flag',
    action: 'delete',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { flagId } = validateWithSchema(deleteFlagSchema, req.body);
      await getFlagService().delete(teamMember.team.id, projectId, flagId);
      res.status(204).end();
    },
  },
});
