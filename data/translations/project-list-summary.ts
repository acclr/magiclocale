import { PrismaClient, type Role } from '@prisma/client';

import {
  emptyProjectKeyCounts,
  summarizeKeyCountRows,
} from '../../domain/translations/project-list-summary';
import type {
  Project,
  ProjectListItem,
  TeamProjectRole,
} from '../../domain/translations/types';
import { prisma } from '../../lib/prisma';

const TEAM_ROLES = new Set<TeamProjectRole>(['OWNER', 'ADMIN', 'MEMBER']);

function toTeamProjectRole(role: Role): TeamProjectRole {
  return TEAM_ROLES.has(role as TeamProjectRole)
    ? (role as TeamProjectRole)
    : 'MEMBER';
}

export async function summarizeProjectList(
  projects: Project[],
  role: Role,
  client: PrismaClient = prisma
): Promise<ProjectListItem[]> {
  if (projects.length === 0) {
    return [];
  }

  const ids = projects.map((project) => project.id);
  const teamRole = toTeamProjectRole(role);
  const [dated, grouped] = await Promise.all([
    client.translationProject.findMany({
      where: { id: { in: ids } },
      select: { id: true, createdAt: true },
    }),
    client.keyMeta.groupBy({
      by: ['projectId', 'lifecycle'],
      where: { projectId: { in: ids } },
      _count: { _all: true },
    }),
  ]);

  const createdAtById = new Map(
    dated.map((project) => [project.id, project.createdAt.toISOString()])
  );
  const countsById = summarizeKeyCountRows(
    grouped.map((row) => ({
      projectId: row.projectId,
      lifecycle: row.lifecycle,
      count: row._count._all,
    }))
  );

  return projects.map((project) => ({
    ...project,
    createdAt: createdAtById.get(project.id) ?? '',
    role: teamRole,
    keyCounts: countsById.get(project.id) ?? emptyProjectKeyCounts(),
  }));
}
