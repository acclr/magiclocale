import type { Environment } from '../../../domain/environments';
import {
  asAiTranslation,
  asManualTranslation,
  paginateTranslationDashboard,
  projectTranslationDashboard,
  type Project,
  type Translation,
  type TranslationKey,
} from '../../../domain/translations';

const environment: Environment = {
  id: 'env_prod',
  projectId: 'project',
  slug: 'production',
  name: 'Production',
  isProduction: true,
  liveVersionId: null,
  parentEnvironmentId: null,
};

describe('projectTranslationDashboard', () => {
  it('projects a complete key by locale grid with filter fields', () => {
    const project: Project = {
      id: 'project',
      teamId: 'team',
      name: 'Website',
      sourceLocale: 'en',
      locales: ['en', 'sv', 'de'],
      localeFormat: 'language',
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
        environmentId: environment.id,
        locale: 'en',
        ...asManualTranslation('Save'),
        updatedAt,
      },
      {
        id: 'sv',
        translationKeyId: 'key',
        environmentId: environment.id,
        locale: 'sv',
        ...asAiTranslation('Spara'),
        updatedAt,
      },
    ];

    const dashboard = projectTranslationDashboard(
      project,
      environment,
      keys,
      translations
    );

    expect(dashboard.rows[0]).toMatchObject({
      keyId: 'key',
      searchText: expect.stringContaining('nav.save save'),
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
      unused: 1,
      deprecated: 0,
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
      localeFormat: 'language',
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
      projectTranslationDashboard(project, environment, keys, []),
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

  it('filters by translated locale values and usage files', () => {
    const project: Project = {
      id: 'project',
      teamId: 'team',
      name: 'Website',
      sourceLocale: 'en',
      locales: ['en', 'de'],
      localeFormat: 'language',
      billingScope: 'team',
      billingId: null,
    };
    const keys: TranslationKey[] = [
      { id: 'one', projectId: project.id, key: 'billing.save', sourceText: 'Save' },
      { id: 'two', projectId: project.id, key: 'nav.close', sourceText: 'Close' },
    ];
    const translations: Translation[] = [
      {
        id: 'de-one',
        translationKeyId: 'one',
        environmentId: environment.id,
        locale: 'de',
        ...asManualTranslation('Speichern'),
        updatedAt: new Date(),
      },
    ];
    const dashboard = paginateTranslationDashboard(
      projectTranslationDashboard(
        project,
        environment,
        keys,
        translations,
        {},
        { 'billing.save': ['src/features/billing/Page.tsx'] }
      ),
      { search: 'locale:de speichern' }
    );
    expect(dashboard.rows.map((row) => row.key)).toEqual(['billing.save']);

    const byFile = paginateTranslationDashboard(
      projectTranslationDashboard(
        project,
        environment,
        keys,
        translations,
        {},
        { 'billing.save': ['src/features/billing/Page.tsx'] }
      ),
      { search: 'file:billing' }
    );
    expect(byFile.rows.map((row) => row.key)).toEqual(['billing.save']);
  });
});
