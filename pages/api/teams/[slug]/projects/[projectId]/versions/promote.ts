import { createTeamProjectApiHandler } from '@/lib/api/team-projects';
import {
  getEnvironmentService,
  getVersionService,
} from '@/lib/translations';
import { notifyVersionPromoted } from '@/lib/versions/notify';
import {
  promoteVersionSchema,
  translationProjectParamsSchema,
  validateWithSchema,
} from '@/lib/zod';

export default createTeamProjectApiHandler({
  POST: {
    resource: 'team_version',
    action: 'publish',
    async handle({ req, res, teamMember }) {
      const { projectId } = validateWithSchema(
        translationProjectParamsSchema,
        req.query
      );
      const body = validateWithSchema(promoteVersionSchema, req.body);
      const environmentService = getEnvironmentService();
      const source = await environmentService.resolve(
        projectId,
        body.sourceEnvironment
      );
      const target = await environmentService.resolve(
        projectId,
        body.targetEnvironment
      );
      await environmentService.get(teamMember.team.id, projectId, source.id);
      await environmentService.get(teamMember.team.id, projectId, target.id);

      const versionService = getVersionService();
      if (!body.apply) {
        const plan = await versionService.previewPromotion(
          source.id,
          target.id,
          body.versionId
        );
        res.status(200).json({ data: { plan, applied: false } });
        return;
      }

      const { plan, applied } = await versionService.applyPromotion(
        source.id,
        target.id,
        {
          versionId: body.versionId,
          actor: teamMember.user.email,
        }
      );

      await notifyVersionPromoted({
        user: teamMember.user,
        team: teamMember.team,
        projectId,
        sourceEnvironment: source,
        targetEnvironment: target,
        applied,
      });

      res.status(200).json({ data: { plan, applied } });
    },
  },
});
