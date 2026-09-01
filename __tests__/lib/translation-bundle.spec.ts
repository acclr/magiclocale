import {
  asCodeTranslation,
  asManualTranslation,
} from '../../domain/translations';
import { buildTranslationBundle } from '../../lib/translations/translation-bundle';
import {
  MemoryRepository,
  type StoreState,
} from '../../test-support/translations-memory-repository';

const PROJECT_ID = 'project_a';
const KEY_ID = 'key_save';

function createRepository(): MemoryRepository {
  const state: StoreState = {
    projects: [
      {
        id: PROJECT_ID,
        teamId: 'team_a',
        name: 'Website',
        sourceLocale: 'en',
        locales: ['en', 'sv'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
      },
    ],
    keys: [
      {
        id: KEY_ID,
        projectId: PROJECT_ID,
        key: 'settings.save',
        sourceText: 'Save changes',
      },
    ],
    translations: [
      {
        id: 'translation_en',
        translationKeyId: KEY_ID,
        locale: 'en',
        ...asCodeTranslation('Save changes'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'translation_sv',
        translationKeyId: KEY_ID,
        locale: 'sv',
        ...asManualTranslation('Spara'),
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ],
  };
  return new MemoryRepository(state);
}

describe('buildTranslationBundle', () => {
  it('projects target values into the stable SDK bundle format', async () => {
    await expect(
      buildTranslationBundle(createRepository(), PROJECT_ID, 'sv')
    ).resolves.toEqual({
      success: true,
      bundle: {
        projectId: PROJECT_ID,
        locale: 'sv',
        sourceLocale: 'en',
        translations: { 'settings.save': 'Spara' },
        version: '2026-02-01T00:00:00.000Z',
      },
    });
  });

  it('uses a manual source-locale override instead of code text', async () => {
    const repository = createRepository();
    await repository.updateTranslation('translation_en', {
      ...asManualTranslation('Save'),
    });

    const result = await buildTranslationBundle(repository, PROJECT_ID, 'en');
    expect(result.success && result.bundle.translations).toEqual({
      'settings.save': 'Save',
    });
  });

  it('rejects unknown projects and unconfigured locales', async () => {
    const repository = createRepository();
    await expect(
      buildTranslationBundle(repository, 'missing', 'sv')
    ).resolves.toEqual({
      success: false,
      reason: 'project-not-found',
    });
    await expect(
      buildTranslationBundle(repository, PROJECT_ID, 'de')
    ).resolves.toEqual({
      success: false,
      reason: 'locale-not-configured',
    });
  });
});
