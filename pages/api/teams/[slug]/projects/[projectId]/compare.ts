import { compareEnvironments } from '@/domain/environments';
import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import {
  getEnvironmentService,
  getFlagService,
  getTeamTranslationService,
} from '@/lib/translations';
import {
  compareEnvironmentsSchema,
  translationProjectParamsSchema,
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
      const { left, right } = validateWithSchema(
        compareEnvironmentsSchema,
        req.query
      );
      const environmentService = getEnvironmentService();
      const [leftEnv, rightEnv, leftFlags, rightFlags, leftDash, rightDash] =
        await Promise.all([
          environmentService.resolve(projectId, left),
          environmentService.resolve(projectId, right),
          getFlagService().list(teamMember.team.id, projectId, left),
          getFlagService().list(teamMember.team.id, projectId, right),
          getTeamTranslationService().dashboard(
            teamMember.team.id,
            projectId,
            left,
            { page: 1, pageSize: 100, filter: 'all', search: '' }
          ),
          getTeamTranslationService().dashboard(
            teamMember.team.id,
            projectId,
            right,
            { page: 1, pageSize: 100, filter: 'all', search: '' }
          ),
        ]);

      const keys = leftDash.rows.map((row) => ({
        id: row.keyId,
        projectId,
        key: row.key,
        sourceText: row.sourceText,
      }));
      const leftTranslations = leftDash.rows.flatMap((row) =>
        Object.values(row.cells)
          .filter((cell) => cell.translationId && cell.value !== null)
          .map((cell) => ({
            id: cell.translationId as string,
            translationKeyId: row.keyId,
            environmentId: leftEnv.id,
            locale: cell.locale,
            value: cell.value as string,
            source: cell.source ?? 'code',
            aiLocked: cell.aiLocked,
            status: cell.status === 'missing' ? 'source' : cell.status,
            updatedAt: new Date(cell.updatedAt ?? Date.now()),
          }))
      );
      const rightTranslations = rightDash.rows.flatMap((row) =>
        Object.values(row.cells)
          .filter((cell) => cell.translationId && cell.value !== null)
          .map((cell) => ({
            id: cell.translationId as string,
            translationKeyId: row.keyId,
            environmentId: rightEnv.id,
            locale: cell.locale,
            value: cell.value as string,
            source: cell.source ?? 'code',
            aiLocked: cell.aiLocked,
            status: cell.status === 'missing' ? 'source' : cell.status,
            updatedAt: new Date(cell.updatedAt ?? Date.now()),
          }))
      );

      const data = compareEnvironments({
        left: leftEnv,
        right: rightEnv,
        leftFlags: leftFlags.flags,
        rightFlags: rightFlags.flags,
        keys,
        leftTranslations,
        rightTranslations,
      });
      res.status(200).json({ data });
    },
  },
});
