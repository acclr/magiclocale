import {
  asAiTranslation,
  asCodeTranslation,
  canAutomaticAiWrite,
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
    expect((await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de'))?.value).toBe(
      'Abbrechen, bitte'
    );
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
    expect(await service.fillMissingForLocale(PROJECT_ID, ENV_ID, 'sv')).toEqual({
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
    expect(await repository.findTranslation(KEY_SAVE, ENV_ID, 'fr')).toMatchObject({
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

    expect(await service.fillMissingForLocale(PROJECT_ID, ENV_ID, 'de')).toEqual({
      filled: 1,
      skipped: 1,
    });
    expect(await repository.getTranslation(TR_DE_SAVE)).toMatchObject({
      value: 'Änderungen speichern',
    });
    expect(await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de')).toMatchObject({
      value: 'AI(de): Cancel',
      source: 'ai',
    });
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
    expect(await repository.findTranslation(key!.id, ENV_ID, 'en')).toMatchObject({
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
    expect(await repository.findTranslation(key!.id, ENV_ID, 'en')).toMatchObject({
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
    expect(await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de')).toMatchObject({
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
    expect(await repository.findTranslation(KEY_CANCEL, ENV_ID, 'de')).toMatchObject({
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
});
