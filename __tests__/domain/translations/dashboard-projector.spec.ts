import {
  asAiTranslation,
  asManualTranslation,
  paginateTranslationDashboard,
  projectTranslationDashboard,
  type Project,
  type Translation,
  type TranslationKey,
} from '../../../domain/translations';

describe('projectTranslationDashboard', () => {
  it('projects a complete key by locale grid with filter fields', () => {
    const project: Project = {
      id: 'project',
      teamId: 'team',
      name: 'Website',
      sourceLocale: 'en',
      locales: ['en', 'sv', 'de'],
      billingScope: 'team',
      billingId: null,
    };
    const keys: TranslationKey[] = [
      {
        id: 'key',
        projectId: project.id,
        key: 'nav.save',
        sourceText: 'Save',
      },
    ];
    const updatedAt = new Date('2026-08-31T08:00:00.000Z');
    const translations: Translation[] = [
      {
        id: 'en',
        translationKeyId: 'key',
        locale: 'en',
        ...asManualTranslation('Save'),
        updatedAt,
      },
      {
        id: 'sv',
        translationKeyId: 'key',
        locale: 'sv',
        ...asAiTranslation('Spara'),
        updatedAt,
      },
    ];

    const dashboard = projectTranslationDashboard(project, keys, translations);

    expect(dashboard.rows[0]).toMatchObject({
      keyId: 'key',
      searchText: 'nav.save save',
      statuses: expect.arrayContaining(['manual', 'ai', 'missing']),
      missingLocales: ['de'],
      cells: {
        de: {
          translationId: null,
          value: null,
          status: 'missing',
          missing: true,
        },
      },
    });
    expect(dashboard.counts).toEqual({
      all: 3,
      ai: 1,
      manual: 1,
      'needs-review': 0,
      missing: 1,
    });
    expect(dashboard.pagination).toEqual({
      page: 1,
      pageSize: 1,
      totalKeys: 1,
      totalPages: 1,
    });
  });

  it('paginates filtered keys without changing global cell counts', () => {
    const project: Project = {
      id: 'project',
      teamId: 'team',
      name: 'Website',
      sourceLocale: 'en',
      locales: ['en'],
      billingScope: 'team',
      billingId: null,
    };
    const keys: TranslationKey[] = [
      {
        id: 'one',
        projectId: project.id,
        key: 'nav.save',
        sourceText: 'Save',
      },
      {
        id: 'two',
        projectId: project.id,
        key: 'nav.cancel',
        sourceText: 'Cancel',
      },
      {
        id: 'three',
        projectId: project.id,
        key: 'nav.close',
        sourceText: 'Close',
      },
    ];
    const dashboard = paginateTranslationDashboard(
      projectTranslationDashboard(project, keys, []),
      { page: 2, pageSize: 1, filter: 'all', search: 'nav.c' }
    );

    expect(dashboard.rows.map((row) => row.key)).toEqual(['nav.close']);
    expect(dashboard.pagination).toEqual({
      page: 2,
      pageSize: 1,
      totalKeys: 2,
      totalPages: 2,
    });
    expect(dashboard.counts.all).toBe(3);
  });
});
