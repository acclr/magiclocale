import {
  asAiTranslation,
  asCodeTranslation,
  asManualTranslation,
  canAutomaticAiWrite,
  detectKeyRenames,
  findDuplicateKeyGroups,
  projectTranslationDashboard,
  suggestMergedKeyName,
  TranslationService,
  TranslatorError,
  type Translation,
  type Translator,
} from '../../../domain/translations';
import {
  MemoryRepository,
  type StoreState,
} from '../../../test-support/translations-memory-repository';

class RecordingTranslator implements Translator {
  readonly calls: {
    text: string;
    sourceLocale: string;
    targetLocale: string;
  }[] = [];

  async translate(input: {
    text: string;
    sourceLocale: string;
    targetLocale: string;
  }): Promise<string> {
    this.calls.push({
      text: input.text,
      sourceLocale: input.sourceLocale,
      targetLocale: input.targetLocale,
    });
    return `AI(${input.targetLocale}): ${input.text}`;
  }
}

const PROJECT_ID = 'proj_acme';
const ENV_ID = 'env_prod';
const KEY_SAVE = 'key_save';
const KEY_CANCEL = 'key_cancel';
const TR_SV_SAVE = 'tr_sv_save';
const TR_DE_SAVE = 'tr_de_save';

function seedState(): StoreState {
  const updatedAt = new Date('2026-01-01T00:00:00.000Z');
  return {
    projects: [
      {
        id: PROJECT_ID,
        teamId: 'team_acme',
        name: 'Acme App',
        sourceLocale: 'en',
        locales: ['en', 'sv', 'de'],
        localeFormat: 'language',
        billingScope: 'team',
        billingId: null,
        allowedOrigins: [],
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
        id: KEY_SAVE,
        projectId: PROJECT_ID,
        key: 'settings.save',
        sourceText: 'Save changes',
      },
      {
        id: KEY_CANCEL,
        projectId: PROJECT_ID,
        key: 'settings.cancel',
        sourceText: 'Cancel',
      },
    ],
    translations: [
      {
        id: 'tr_en_save',
        translationKeyId: KEY_SAVE,
        environmentId: ENV_ID,
        locale: 'en',
        ...asCodeTranslation('Save changes'),
        updatedAt,
      },
      {
        id: TR_SV_SAVE,
        translationKeyId: KEY_SAVE,
        environmentId: ENV_ID,
        locale: 'sv',
        ...asAiTranslation('Spara ändringar'),
        updatedAt,
      },
      {
        id: TR_DE_SAVE,
        translationKeyId: KEY_SAVE,
        environmentId: ENV_ID,
        locale: 'de',
        ...asAiTranslation('Änderungen speichern'),
        updatedAt,
      },
      {
        id: 'tr_en_cancel',
        translationKeyId: KEY_CANCEL,
        environmentId: ENV_ID,
        locale: 'en',
        ...asCodeTranslation('Cancel'),
        updatedAt,
      },
      {
        id: 'tr_sv_cancel',
        translationKeyId: KEY_CANCEL,
        environmentId: ENV_ID,
        locale: 'sv',
        ...asAiTranslation('Avbryt'),
        updatedAt,
      },
    ],
  };
}

function setup() {
  const translator = new RecordingTranslator();
  const repository = new MemoryRepository(seedState());
  const service = new TranslationService(repository, translator);
  return { translator, repository, service };
}

describe('canAutomaticAiWrite', () => {
  it('allows missing rows and blocks every form of human ownership', () => {
    expect(canAutomaticAiWrite(null)).toBe(true);
    expect(
      canAutomaticAiWrite({ aiLocked: true, source: 'ai' } as Translation)
    ).toBe(false);
    expect(
      canAutomaticAiWrite({ aiLocked: false, source: 'manual' } as Translation)
    ).toBe(false);
  });
});

describe('TranslationService', () => {
  it('locks persisted edits and newly typed values immediately', async () => {
    const { service, repository } = setup();
    const updated = await service.saveManualEdit(TR_SV_SAVE, 'Spara');
    const created = await service.saveManualValue(
      KEY_CANCEL,
      ENV_ID,
      'de',
      'Abbrechen, bitte'
    );

    expect(updated).toMatchObject({
      value: 'Spara',
      source: 'manual',
      aiLocked: true,
      status: 'manual',
    });
    expect(created).toMatchObject({
      value: 'Abbrechen, bitte',
      source: 'manual',
      aiLocked: true,
    });
    await expect(
      service.generateMissingTranslation(KEY_CANCEL, ENV_ID, 'de')
    ).resolves.toMatchObject({ outcome: 'skipped' });
    expect(
      (await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de'))?.value
    ).toBe('Abbrechen, bitte');
  });

  it('never overwrites human content during fill, sync, or bulk jobs', async () => {
    const { service, translator, repository } = setup();
    await service.saveManualEdit(TR_SV_SAVE, 'Spara');
    translator.calls.length = 0;

    await expect(
      service.generateMissingTranslation(KEY_SAVE, ENV_ID, 'sv')
    ).resolves.toMatchObject({
      outcome: 'skipped',
      reason: 'already-exists',
    });
    expect(
      await service.fillMissingForLocale(PROJECT_ID, ENV_ID, 'sv')
    ).toEqual({
      filled: 0,
      skipped: 2,
    });
    expect(
      await service.syncFromSource(PROJECT_ID, ENV_ID, [
        { key: 'settings.save', sourceText: 'Save changes' },
        { key: 'settings.cancel', sourceText: 'Cancel' },
      ])
    ).toMatchObject({ filled: 1 });

    expect(await repository.getTranslation(TR_SV_SAVE)).toMatchObject({
      value: 'Spara',
      source: 'manual',
      aiLocked: true,
    });
    expect(
      translator.calls.some(
        ({ text, targetLocale }) =>
          text === 'Save changes' && targetLocale === 'sv'
      )
    ).toBe(false);
  });

  it('regenerates AI-owned rows after source changes', async () => {
    const { service, repository } = setup();
    const result = await service.handleSourceChange(
      KEY_SAVE,
      ENV_ID,
      'Save settings'
    );

    expect(result.needsReview).toHaveLength(0);
    expect(result.regenerated.map(({ locale }) => locale).sort()).toEqual([
      'de',
      'sv',
    ]);
    expect(await repository.getTranslation(TR_SV_SAVE)).toMatchObject({
      value: 'AI(sv): Save settings',
      source: 'ai',
      aiLocked: false,
    });
  });

  it('preserves human targets and marks them needs-review', async () => {
    const { service, repository, translator } = setup();
    await service.saveManualEdit(TR_SV_SAVE, 'Spara');
    translator.calls.length = 0;

    const result = await service.handleSourceChange(
      KEY_SAVE,
      ENV_ID,
      'Save settings'
    );

    expect(result.needsReview.map(({ locale }) => locale)).toEqual(['sv']);
    expect(result.regenerated.map(({ locale }) => locale)).toEqual(['de']);
    expect(await repository.getTranslation(TR_SV_SAVE)).toMatchObject({
      value: 'Spara',
      source: 'manual',
      aiLocked: true,
      status: 'needs-review',
    });
    expect(translator.calls).toEqual([
      { text: 'Save settings', sourceLocale: 'en', targetLocale: 'de' },
    ]);
  });

  it('preserves a manual source-locale override on source change', async () => {
    const { service, repository } = setup();
    await service.saveManualEdit('tr_en_save', 'Save');

    const result = await service.handleSourceChange(
      KEY_SAVE,
      ENV_ID,
      'Save settings'
    );

    expect(result.needsReview.map(({ locale }) => locale)).toEqual(['en']);
    expect(await repository.getTranslation('tr_en_save')).toMatchObject({
      value: 'Save',
      source: 'manual',
      aiLocked: true,
      status: 'needs-review',
    });
  });

  it('translates only a newly added locale', async () => {
    const { service, repository } = setup();
    await service.saveManualEdit(TR_SV_SAVE, 'Spara');

    expect(await service.translateNewLocale(PROJECT_ID, ENV_ID, 'fr')).toEqual({
      filled: 2,
      skipped: 0,
    });
    expect(await repository.getTranslation(TR_SV_SAVE)).toMatchObject({
      value: 'Spara',
      aiLocked: true,
    });
    expect(await repository.getTranslation(TR_DE_SAVE)).toMatchObject({
      value: 'Änderungen speichern',
    });
    expect(
      await repository.findTranslation(KEY_SAVE, ENV_ID, 'fr')
    ).toMatchObject({
      value: 'AI(fr): Save changes',
      source: 'ai',
      aiLocked: false,
    });
  });

  it('keeps suggestions read-only and preserves ownership when accepted', async () => {
    const { service, repository } = setup();
    await service.saveManualEdit(TR_SV_SAVE, 'Spara');

    await expect(service.suggestTranslation(KEY_SAVE, 'sv')).resolves.toBe(
      'AI(sv): Save changes'
    );
    expect(await repository.getTranslation(TR_SV_SAVE)).toMatchObject({
      value: 'Spara',
      source: 'manual',
      aiLocked: true,
    });

    const accepted = await service.acceptSuggestion(
      TR_SV_SAVE,
      'AI(sv): Save changes'
    );
    expect(accepted).toMatchObject({
      value: 'AI(sv): Save changes',
      source: 'manual',
      aiLocked: true,
      status: 'manual',
    });
  });

  it('fills missing rows without replacing existing AI rows', async () => {
    const { service, repository } = setup();

    expect(
      await service.fillMissingForLocale(PROJECT_ID, ENV_ID, 'de')
    ).toEqual({
      filled: 1,
      skipped: 1,
    });
    expect(await repository.getTranslation(TR_DE_SAVE)).toMatchObject({
      value: 'Änderungen speichern',
    });
    expect(
      await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de')
    ).toMatchObject({
      value: 'AI(de): Cancel',
      source: 'ai',
    });
  });

  it('does not translate again when a synced key is already complete', async () => {
    const { service, translator } = setup();
    translator.calls.length = 0;

    await expect(
      service.syncFromSource(PROJECT_ID, ENV_ID, [
        { key: 'settings.save', sourceText: 'Save changes' },
      ])
    ).resolves.toMatchObject({
      createdKeys: 0,
      filled: 0,
      sourceChanges: 0,
    });
    expect(translator.calls).toEqual([]);
  });

  it('creates source and target rows for new synced keys', async () => {
    const { service, repository } = setup();
    const result = await service.syncFromSource(PROJECT_ID, ENV_ID, [
      { key: 'nav.home', sourceText: 'Home' },
    ]);

    expect(result).toEqual({
      createdKeys: 1,
      sourceChanges: 0,
      filled: 2,
      regenerated: 0,
      needsReview: 0,
      fillFailed: 0,
    });
    const key = await repository.findKeyByName(PROJECT_ID, 'nav.home');
    expect(
      await repository.findTranslation(key!.id, ENV_ID, 'en')
    ).toMatchObject({
      value: 'Home',
      source: 'code',
      aiLocked: false,
    });
  });

  it('ingests source keys even when AI fill is unavailable', async () => {
    const repository = new MemoryRepository(seedState());
    const translator: Translator = {
      async translate() {
        throw new Error('OPENAI_API_KEY is required for AI translation');
      },
    };
    const service = new TranslationService(repository, translator);

    await expect(
      service.syncFromSource(PROJECT_ID, ENV_ID, [
        { key: 'nav.home', sourceText: 'Home' },
      ])
    ).resolves.toEqual({
      createdKeys: 1,
      sourceChanges: 0,
      filled: 0,
      regenerated: 0,
      needsReview: 0,
      fillFailed: 2,
    });

    const key = await repository.findKeyByName(PROJECT_ID, 'nav.home');
    expect(
      await repository.findTranslation(key!.id, ENV_ID, 'en')
    ).toMatchObject({
      value: 'Home',
      source: 'code',
    });
    expect(await repository.findTranslation(key!.id, ENV_ID, 'sv')).toBeNull();
  });

  it('still surfaces translator failures for explicit fill requests', async () => {
    const repository = new MemoryRepository(seedState());
    const service = new TranslationService(repository, {
      async translate() {
        throw new Error('OPENAI_API_KEY is required for AI translation');
      },
    });

    await expect(
      service.fillMissingForLocale(PROJECT_ID, ENV_ID, 'de')
    ).rejects.toBeInstanceOf(TranslatorError);
  });

  it('retranslates selected locales from an override source language', async () => {
    const { service, repository, translator } = setup();
    await service.saveManualEdit(TR_SV_SAVE, 'Spara');
    translator.calls.length = 0;

    await expect(
      service.retranslateLocales(PROJECT_ID, ENV_ID, ['sv', 'de'], 'en')
    ).resolves.toEqual({
      filled: 3,
      skipped: 1,
      failed: 0,
    });
    expect(await repository.getTranslation(TR_SV_SAVE)).toMatchObject({
      value: 'Spara',
      source: 'manual',
    });
    expect(await repository.getTranslation(TR_DE_SAVE)).toMatchObject({
      value: 'AI(de): Save changes',
      source: 'ai',
    });
    expect(
      await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de')
    ).toMatchObject({
      value: 'AI(de): Cancel',
      source: 'ai',
    });
    expect(translator.calls).toEqual([
      { text: 'Save changes', sourceLocale: 'en', targetLocale: 'de' },
      { text: 'Cancel', sourceLocale: 'en', targetLocale: 'sv' },
      { text: 'Cancel', sourceLocale: 'en', targetLocale: 'de' },
    ]);
  });

  it('translateSelection only touches the requested keys and locales', async () => {
    const { service, repository, translator } = setup();
    translator.calls.length = 0;

    await expect(
      service.translateSelection(PROJECT_ID, ENV_ID, {
        keyIds: [KEY_CANCEL],
        locales: ['de'],
        mode: 'fill-missing',
      })
    ).resolves.toEqual({
      filled: 1,
      skipped: 0,
      failed: 0,
    });
    expect(
      await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de')
    ).toMatchObject({
      value: 'AI(de): Cancel',
      source: 'ai',
    });
    expect(translator.calls).toEqual([
      { text: 'Cancel', sourceLocale: 'en', targetLocale: 'de' },
    ]);
  });

  it('can rewrite the source column when the source strings are another language', async () => {
    const { service, repository, translator } = setup();
    translator.calls.length = 0;

    await expect(
      service.retranslateLocales(PROJECT_ID, ENV_ID, ['en'], 'sv')
    ).resolves.toEqual({
      filled: 2,
      skipped: 0,
      failed: 0,
    });
    expect(await repository.getTranslation('tr_en_save')).toMatchObject({
      value: 'AI(en): Save changes',
      source: 'ai',
      status: 'ai',
    });
    expect(translator.calls).toEqual([
      { text: 'Save changes', sourceLocale: 'sv', targetLocale: 'en' },
      { text: 'Cancel', sourceLocale: 'sv', targetLocale: 'en' },
    ]);
  });

  it('recognizes a renamed key (accept-invite -> invitations.acceptInvite) and renames it in-place without retranslating', async () => {
    const state = seedState();
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    state.keys.push({
      id: 'key_accept_invite',
      projectId: PROJECT_ID,
      key: 'accept-invite',
      sourceText: 'Accept invitation',
    });
    state.translations.push(
      {
        id: 'tr_en_accept',
        translationKeyId: 'key_accept_invite',
        environmentId: ENV_ID,
        locale: 'en',
        ...asCodeTranslation('Accept invitation'),
        updatedAt,
      },
      {
        id: 'tr_sv_accept',
        translationKeyId: 'key_accept_invite',
        environmentId: ENV_ID,
        locale: 'sv',
        ...asManualTranslation('Acceptera inbjudan'),
        updatedAt,
      },
      {
        id: 'tr_de_accept',
        translationKeyId: 'key_accept_invite',
        environmentId: ENV_ID,
        locale: 'de',
        ...asAiTranslation('Einladung annehmen'),
        updatedAt,
      }
    );

    const translator = new RecordingTranslator();
    const repository = new MemoryRepository(state);
    const service = new TranslationService(repository, translator);

    const result = await service.syncFromSource(
      PROJECT_ID,
      ENV_ID,
      [
        {
          key: 'invitations.acceptInvite',
          sourceText: 'Accept invitation',
          usage: { file: 'components/invitation/AcceptInvitation.tsx', line: 39 },
        },
      ],
      { removed: ['accept-invite'] }
    );

    expect(result).toEqual({
      createdKeys: 0,
      sourceChanges: 0,
      filled: 0,
      regenerated: 0,
      needsReview: 0,
      fillFailed: 0,
      renamedKeys: [
        { fromKey: 'accept-invite', toKey: 'invitations.acceptInvite' },
      ],
    });
    expect(translator.calls).toEqual([]);
    expect(
      await repository.findKeyByName(PROJECT_ID, 'accept-invite')
    ).toBeNull();
    const renamedKey = await repository.findKeyByName(
      PROJECT_ID,
      'invitations.acceptInvite'
    );
    expect(renamedKey).toMatchObject({
      id: 'key_accept_invite',
      key: 'invitations.acceptInvite',
      sourceText: 'Accept invitation',
    });
    expect(
      await repository.findTranslation('key_accept_invite', ENV_ID, 'sv')
    ).toMatchObject({
      value: 'Acceptera inbjudan',
      source: 'manual',
      aiLocked: true,
    });
  });

  it('merges duplicate keys (feature1.ok, feature2.ok -> common.ok), preserves human edits, and protects against recreating merged keys on sync', async () => {
    const state = seedState();
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    state.keys.push(
      {
        id: 'key_feature1_ok',
        projectId: PROJECT_ID,
        key: 'feature1.ok',
        sourceText: 'Okay',
      },
      {
        id: 'key_feature2_ok',
        projectId: PROJECT_ID,
        key: 'feature2.ok',
        sourceText: 'Okay',
      }
    );
    state.translations.push(
      {
        id: 'tr_en_f1_ok',
        translationKeyId: 'key_feature1_ok',
        environmentId: ENV_ID,
        locale: 'en',
        ...asCodeTranslation('Okay'),
        updatedAt,
      },
      {
        id: 'tr_sv_f1_ok',
        translationKeyId: 'key_feature1_ok',
        environmentId: ENV_ID,
        locale: 'sv',
        ...asAiTranslation('Okej (AI)'),
        updatedAt,
      },
      {
        id: 'tr_en_f2_ok',
        translationKeyId: 'key_feature2_ok',
        environmentId: ENV_ID,
        locale: 'en',
        ...asCodeTranslation('Okay'),
        updatedAt,
      },
      {
        id: 'tr_sv_f2_ok',
        translationKeyId: 'key_feature2_ok',
        environmentId: ENV_ID,
        locale: 'sv',
        ...asManualTranslation('Okej'),
        updatedAt,
      },
      {
        id: 'tr_de_f2_ok',
        translationKeyId: 'key_feature2_ok',
        environmentId: ENV_ID,
        locale: 'de',
        ...asAiTranslation('Okay'),
        updatedAt,
      }
    );

    const catalogEntries = new Map<
      string,
      {
        id: string;
        projectId: string;
        type: 'translation';
        key: string;
        namespace: string | null;
        description: null;
        developerNote: null;
        owner: null;
        tags: string[];
        lifecycle: 'active' | 'deprecated';
        replacementKey: string | null;
        firstSeenAt: Date;
        lastSeenAt: Date;
        reviewAt: null;
        usageCount: number;
      }
    >();

    const translator = new RecordingTranslator();
    const repository = new MemoryRepository(state);
    const service = new TranslationService(repository, translator, undefined, {
      async recordDetection(input) {
        const existing = catalogEntries.get(input.key);
        if (existing) {
          return existing;
        }
        const entry = {
          id: `meta_${input.key}`,
          projectId: input.projectId,
          type: 'translation' as const,
          key: input.key,
          namespace: null,
          description: null,
          developerNote: null,
          owner: null,
          tags: [],
          lifecycle: 'active' as const,
          replacementKey: null,
          firstSeenAt: updatedAt,
          lastSeenAt: updatedAt,
          reviewAt: null,
          usageCount: 1,
        };
        catalogEntries.set(input.key, entry);
        return entry;
      },
      async upsertDefinition(input) {
        const entry = {
          id: `meta_${input.key}`,
          projectId: input.projectId,
          type: 'translation' as const,
          key: input.key,
          namespace: null,
          description: null,
          developerNote: null,
          owner: null,
          tags: [],
          lifecycle: (input.lifecycle ?? 'active') as 'active' | 'deprecated',
          replacementKey: null,
          firstSeenAt: updatedAt,
          lastSeenAt: updatedAt,
          reviewAt: null,
          usageCount: 1,
        };
        catalogEntries.set(input.key, entry);
        return entry;
      },
      async listAll() {
        return Array.from(catalogEntries.values());
      },
      async markMergedKeys(input) {
        for (const fromKey of input.fromKeys) {
          catalogEntries.set(fromKey, {
            id: `meta_${fromKey}`,
            projectId: input.projectId,
            type: 'translation',
            key: fromKey,
            namespace: null,
            description: null,
            developerNote: null,
            owner: null,
            tags: [],
            lifecycle: 'deprecated',
            replacementKey: input.toKey,
            firstSeenAt: updatedAt,
            lastSeenAt: updatedAt,
            reviewAt: null,
            usageCount: 1,
          });
        }
      },
    });

    const dashboardBefore = projectTranslationDashboard(
      state.projects[0],
      state.environments[0],
      await repository.listKeys(PROJECT_ID),
      await repository.listTranslations(PROJECT_ID, ENV_ID)
    );
    const duplicateGroups = findDuplicateKeyGroups(dashboardBefore.rows);
    expect(duplicateGroups).toHaveLength(1);
    expect(duplicateGroups[0]).toMatchObject({
      sourceText: 'Okay',
      suggestedKey: 'common.ok',
    });
    expect(suggestMergedKeyName(['feature1.ok', 'feature2.ok'])).toBe(
      'common.ok'
    );

    const mergeResult = await service.mergeKeys({
      projectId: PROJECT_ID,
      environmentId: ENV_ID,
      sourceKeys: ['feature1.ok', 'feature2.ok'],
      targetKey: 'common.ok',
    });

    expect(mergeResult).toMatchObject({
      targetKey: 'common.ok',
      sourceText: 'Okay',
      mergedKeys: ['feature1.ok', 'feature2.ok'],
    });
    expect(
      await repository.findKeyByName(PROJECT_ID, 'feature1.ok')
    ).toBeNull();
    expect(
      await repository.findKeyByName(PROJECT_ID, 'feature2.ok')
    ).toBeNull();

    const commonOk = await repository.findKeyByName(PROJECT_ID, 'common.ok');
    expect(commonOk).not.toBeNull();
    expect(
      await repository.findTranslation(commonOk!.id, ENV_ID, 'sv')
    ).toMatchObject({
      value: 'Okej',
      source: 'manual',
      status: 'manual',
      aiLocked: true,
    });

    const activeMerges = await service.listActiveKeyMerges(PROJECT_ID);
    expect(activeMerges).toEqual([
      { fromKey: 'feature1.ok', toKey: 'common.ok', sourceText: 'Okay' },
      { fromKey: 'feature2.ok', toKey: 'common.ok', sourceText: 'Okay' },
    ]);

    // If an un-rewritten client pushes feature1.ok, syncFromSource does not recreate it
    const syncResult = await service.syncFromSource(PROJECT_ID, ENV_ID, [
      { key: 'feature1.ok', sourceText: 'Okay' },
    ]);
    expect(syncResult.createdKeys).toBe(0);
    expect(syncResult.mergedKeys).toEqual([
      { fromKey: 'feature1.ok', toKey: 'common.ok', sourceText: 'Okay' },
    ]);
  });

  it('does not confuse active duplicate keys in different files with a rename', () => {
    const renames = detectKeyRenames({
      missingIncoming: [
        {
          key: 'feature2.ok',
          sourceText: 'Okay',
          usage: { file: 'components/Feature2.tsx', line: 10 },
        },
      ],
      allIncomingKeyNames: ['feature2.ok'],
      removedKeys: [],
      existingKeys: [
        {
          id: 'key_f1',
          projectId: PROJECT_ID,
          key: 'feature1.ok',
          sourceText: 'Okay',
        },
      ],
      catalogMeta: [
        {
          id: 'meta_f1',
          projectId: PROJECT_ID,
          type: 'translation',
          key: 'feature1.ok',
          namespace: 'feature1',
          description: null,
          developerNote: null,
          owner: null,
          tags: [],
          lifecycle: 'active',
          replacementKey: null,
          firstSeenAt: new Date(),
          lastSeenAt: new Date(),
          reviewAt: null,
          usageCount: 1,
        },
      ],
      usages: [
        {
          id: 'usage_f1',
          keyMetaId: 'meta_f1',
          file: 'components/Feature1.tsx',
          line: 12,
          column: 4,
          snippet: null,
          detectedAt: new Date(),
        },
      ],
    });
    expect(renames).toEqual([]);
  });
});
