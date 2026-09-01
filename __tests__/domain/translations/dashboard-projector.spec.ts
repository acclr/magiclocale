import {
  asAiTranslation,
  asManualTranslation,
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
  });
});
