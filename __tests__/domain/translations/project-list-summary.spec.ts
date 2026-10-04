import { summarizeKeyCountRows } from '../../../domain/translations/project-list-summary';

describe('summarizeKeyCountRows', () => {
  it('totals keys and splits active from deprecated', () => {
    const counts = summarizeKeyCountRows([
      { projectId: 'a', lifecycle: 'ACTIVE', count: 12 },
      { projectId: 'a', lifecycle: 'DEPRECATED', count: 3 },
      { projectId: 'a', lifecycle: 'UNUSED', count: 2 },
      { projectId: 'b', lifecycle: 'active', count: 1 },
    ]);

    expect(counts.get('a')).toEqual({
      total: 17,
      active: 12,
      deprecated: 3,
    });
    expect(counts.get('b')).toEqual({
      total: 1,
      active: 1,
      deprecated: 0,
    });
  });
});
