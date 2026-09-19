import { EnvironmentService } from '../../domain/environments';
import { ProjectService } from '../../domain/translations';
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
const ENV_ID = 'env_prod';
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
    environments: [
      {
        id: ENV_ID,
        projectId: PROJECT_ID,
        slug: 'production',
        name: 'Production',
        isProduction: true,
        liveVersionId: null,
        parentEnvironmentId: null,
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
        environmentId: ENV_ID,
        locale: 'en',
        ...asCodeTranslation('Save changes'),
        updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      },
      {
        id: 'translation_sv',
        translationKeyId: KEY_ID,
        environmentId: ENV_ID,
        locale: 'sv',
        ...asManualTranslation('Spara'),
        updatedAt: new Date('2026-02-01T00:00:00.000Z'),
      },
    ],
  };
  return new MemoryRepository(state);
}

function deps(repository: MemoryRepository) {
  const environmentService = new EnvironmentService(
    repository,
    new ProjectService(repository)
  );
  const versionService = {
    resolveLocaleBundle: async (
      _environmentId: string,
      locale: string,
      version?: number | null
    ) => {
      if (version === 99) {
        return { bundle: null, version: null };
      }
      const translations = await repository.listTranslations(
        PROJECT_ID,
        ENV_ID
      );
      const values: Record<string, string> = {};
      for (const translation of translations) {
        if (translation.locale === locale) {
          const key = (await repository.listKeys(PROJECT_ID)).find(
            (item) => item.id === translation.translationKeyId
          );
          if (key) {
            values[key.key] = translation.value;
          }
        }
      }
      return {
        bundle: {
          locale,
          translations: values,
          metadata: {},
          keyCount: Object.keys(values).length,
        },
        version: {
          id: 'v1',
          environmentId: ENV_ID,
          number: 1,
          status: 'published' as const,
          message: null,
          createdBy: null,
          publishedAt: new Date('2026-02-01T00:00:00.000Z'),
          publishedBy: null,
          promotedFromId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      };
    },
  };

  return { repository, environmentService, versionService };
}

describe('buildTranslationBundle', () => {
  it('projects target values into the stable SDK bundle format', async () => {
    const repository = createRepository();
    await expect(
      buildTranslationBundle(deps(repository), {
        projectId: PROJECT_ID,
        locale: 'sv',
      })
    ).resolves.toMatchObject({
      success: true,
      bundle: {
        projectId: PROJECT_ID,
        environment: 'production',
        locale: 'sv',
        sourceLocale: 'en',
        translations: { 'settings.save': 'Spara' },
        version: '1',
        versionNumber: 1,
      },
    });
  });

  it('uses a manual source-locale override instead of code text', async () => {
    const repository = createRepository();
    await repository.updateTranslation('translation_en', {
      ...asManualTranslation('Save'),
    });

    const result = await buildTranslationBundle(deps(repository), {
      projectId: PROJECT_ID,
      locale: 'en',
    });
    expect(result.success && result.bundle.translations).toEqual({
      'settings.save': 'Save',
    });
  });

  it('rejects unknown projects, environments, locales, and pinned versions', async () => {
    const repository = createRepository();
    await expect(
      buildTranslationBundle(deps(repository), {
        projectId: 'missing',
        locale: 'sv',
      })
    ).resolves.toEqual({
      success: false,
      reason: 'project-not-found',
    });
    await expect(
      buildTranslationBundle(deps(repository), {
        projectId: PROJECT_ID,
        locale: 'de',
      })
    ).resolves.toEqual({
      success: false,
      reason: 'locale-not-configured',
    });
    await expect(
      buildTranslationBundle(deps(repository), {
        projectId: PROJECT_ID,
        locale: 'sv',
        environment: 'missing',
      })
    ).resolves.toEqual({
      success: false,
      reason: 'environment-not-found',
    });
    await expect(
      buildTranslationBundle(deps(repository), {
        projectId: PROJECT_ID,
        locale: 'sv',
        version: 99,
      })
    ).resolves.toEqual({
      success: false,
      reason: 'version-not-found',
    });
  });
});
