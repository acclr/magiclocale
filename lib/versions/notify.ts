import type { Team } from '@prisma/client';
import type { User } from 'next-auth';

import { sendAudit } from '@/lib/retraced';
import { sendEvent } from '@/lib/svix';
import type { Environment } from '@/domain/environments';
import type { PublishResult, Version } from '@/domain/versions';

export async function notifyVersionPublished(input: {
  user: User;
  team: Team;
  projectId: string;
  environment: Environment;
  result: PublishResult;
}): Promise<void> {
  const payload = {
    projectId: input.projectId,
    environmentId: input.environment.id,
    environment: input.environment.slug,
    versionId: input.result.version.id,
    versionNumber: input.result.version.number,
    changed: input.result.changed,
    localeCount: input.result.localeCount,
    flagCount: input.result.flagCount,
  };

  sendAudit({
    action: 'version.publish',
    crud: 'u',
    user: input.user,
    team: input.team,
  });

  try {
    await sendEvent(input.team.id, 'version.published', payload);
  } catch (error) {
    console.error('Unable to emit version.published webhook.', error);
  }
}

export async function notifyVersionRolledBack(input: {
  user: User;
  team: Team;
  projectId: string;
  environment: Environment;
  version: Version;
}): Promise<void> {
  sendAudit({
    action: 'version.rollback',
    crud: 'u',
    user: input.user,
    team: input.team,
  });

  try {
    await sendEvent(input.team.id, 'version.rolled_back', {
      projectId: input.projectId,
      environmentId: input.environment.id,
      environment: input.environment.slug,
      versionId: input.version.id,
      versionNumber: input.version.number,
    });
  } catch (error) {
    console.error('Unable to emit version.rolled_back webhook.', error);
  }
}

export async function notifyVersionPromoted(input: {
  user: User;
  team: Team;
  projectId: string;
  sourceEnvironment: Environment;
  targetEnvironment: Environment;
  applied: number;
}): Promise<void> {
  sendAudit({
    action: 'version.promote',
    crud: 'u',
    user: input.user,
    team: input.team,
  });

  try {
    await sendEvent(input.team.id, 'version.promoted', {
      projectId: input.projectId,
      sourceEnvironment: input.sourceEnvironment.slug,
      targetEnvironment: input.targetEnvironment.slug,
      applied: input.applied,
    });
  } catch (error) {
    console.error('Unable to emit version.promoted webhook.', error);
  }
}
