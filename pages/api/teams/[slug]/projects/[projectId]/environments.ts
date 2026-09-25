import { canAddEnvironment, environmentLimitMessage } from '@/domain/billing';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import { getProjectEntitlement } from '@/lib/billing/entitlement';
import { ApiError } from '@/lib/errors';
import {
  getEnvironmentService,
  getFlagService,
  getProjectService,
} from '@/lib/translations';
import {
  createEnvironmentSchema,
  deleteEnvironmentSchema,
  translationProjectParamsSchema,
  updateEnvironmentSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  GET: {
    resource: 'team_environment',
    action: 'read',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const environments = await getEnvironmentService().list(
        teamMember.team.id,
        projectId
      );
      res.status(200).json({ data: environments });
    },
  },
  POST: {
    resource: 'team_environment',
    action: 'create',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const input = validateWithSchema(createEnvironmentSchema, req.body);
      const project = await getProjectService().get(
        teamMember.team.id,
        projectId
      );
      const environments = await getEnvironmentService().list(
        teamMember.team.id,
        projectId
      );
      const entitlement = await getProjectEntitlement(
        project,
        teamMember.team.billingId
      );
      if (
        !canAddEnvironment(environments.length, entitlement.maxEnvironments)
      ) {
        throw new ApiError(
          402,
          environmentLimitMessage(entitlement.maxEnvironments ?? 2)
        );
      }

      const environment = await getEnvironmentService().create(
        teamMember.team.id,
        projectId,
        input
      );
      await getFlagService().provisionEnvironment(project.id, environment.id);
      res.status(201).json({ data: environment });
    },
  },
  PATCH: {
    resource: 'team_environment',
    action: 'update',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { environmentId, name, parentEnvironmentId } = validateWithSchema(
        updateEnvironmentSchema,
        req.body
      );
      let environment = await getEnvironmentService().get(
        teamMember.team.id,
        projectId,
        environmentId
      );
      if (name) {
        environment = await getEnvironmentService().rename(
          teamMember.team.id,
          projectId,
          environmentId,
          name
        );
      }
      if (parentEnvironmentId !== undefined) {
        environment = await getEnvironmentService().setParent(
          teamMember.team.id,
          projectId,
          environmentId,
          parentEnvironmentId
        );
      }
      res.status(200).json({ data: environment });
    },
  },
  DELETE: {
    resource: 'team_environment',
    action: 'delete',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const { environmentId } = validateWithSchema(
        deleteEnvironmentSchema,
        req.body
      );
      await getEnvironmentService().delete(
        teamMember.team.id,
        projectId,
        environmentId
      );
      res.status(204).end();
    },
  },
});
