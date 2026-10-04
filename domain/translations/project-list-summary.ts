import type { ProjectKeyCounts } from './types';

const ACTIVE = new Set(['ACTIVE', 'active']);
const DEPRECATED = new Set(['DEPRECATED', 'deprecated']);

export function emptyProjectKeyCounts(): ProjectKeyCounts {
  return { total: 0, active: 0, deprecated: 0 };
}

export function summarizeKeyCountRows(
  rows: Array<{ projectId: string; lifecycle: string; count: number }>
): Map<string, ProjectKeyCounts> {
  const byProject = new Map<string, ProjectKeyCounts>();

  for (const row of rows) {
    const current = byProject.get(row.projectId) ?? emptyProjectKeyCounts();
    current.total += row.count;
    if (ACTIVE.has(row.lifecycle)) {
      current.active += row.count;
    }
    if (DEPRECATED.has(row.lifecycle)) {
      current.deprecated += row.count;
    }
    byProject.set(row.projectId, current);
  }

  return byProject;
}
