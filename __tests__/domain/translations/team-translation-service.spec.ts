import {
  ProjectService,
  TeamTranslationService,
  TranslationService,
  type Translator,
} from '../../../domain/translations';
import {
  MemoryRepository,
  type StoreState,
} from '../../../test-support/translations-memory-repository';

const translator: Translator = {
  async translate({ text, targetLocale }) {
    return `${targetLocale}:${text}`;
  },
};

function setup() {
  const state: StoreState = {
    projects: [
      {
        id: 'owned',
        teamId: 'team-a',
        name: 'Owned',
        sourceLocale: 'en',
        locales: ['en', 'sv'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
      },
      {
        id: 'foreign',
        teamId: 'team-b',
        name: 'Foreign',
        sourceLocale: 'en',
        locales: ['en', 'sv'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
      },
    ],
    keys: [
      { id: 'owned-key', projectId: 'owned', key: 'save', sourceText: 'Save' },
      {
        id: 'foreign-key',
        projectId: 'foreign',
        key: 'secret',
        sourceText: 'Secret',
      },
    ],
    translations: [],
  };
  const repository = new MemoryRepository(state);
  const projectService = new ProjectService(repository);
  const translationService = new TranslationService(repository, translator);
  const service = new TeamTranslationService(
    repository,
    projectService,
    translationService
  );
  return { repository, service };
}

describe('TeamTranslationService', () => {
  it('rejects foreign projects and keys before translation mutation', async () => {
    const { service } = setup();

    await expect(service.dashboard('team-a', 'foreign')).rejects.toThrow(
      'Project not found: foreign'
    );
    await expect(
      service.saveManual('team-a', 'owned', 'foreign-key', 'sv', 'Hemligt')
    ).rejects.toThrow('Translation key not found: foreign-key');
  });

  it('saves missing manual cells as human-owned values', async () => {
    const { repository, service } = setup();

    await expect(
      service.saveManual('team-a', 'owned', 'owned-key', 'sv', 'Spara')
    ).resolves.toMatchObject({
      source: 'manual',
      aiLocked: true,
      status: 'manual',
    });
    await expect(
      repository.findTranslation('owned-key', 'sv')
    ).resolves.toMatchObject({ value: 'Spara' });
  });

  it('paginates the dashboard for the owning team', async () => {
    const { service } = setup();

    const dashboard = await service.dashboard('team-a', 'owned', {
      page: 1,
      pageSize: 1,
    });

    expect(dashboard.rows).toHaveLength(1);
    expect(dashboard.pagination).toMatchObject({
      page: 1,
      pageSize: 1,
      totalKeys: 1,
      totalPages: 1,
    });
  });

  it('rejects retranslate on a foreign project locale', async () => {
    const { service } = setup();

    await expect(
      service.retranslate('team-a', 'owned', ['de'])
    ).rejects.toThrow('Locale not found in project: de');
  });
});
