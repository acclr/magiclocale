import {
  asAiTranslation,
  asManualTranslation,
} from '../../../domain/translations';
import { cellId, planPromotion } from '../../../domain/versions/snapshot';

describe('planPromotion', () => {
  it('never overwrites a human-owned target with an AI-written incoming cell', () => {
    const plan = planPromotion({
      sourceEnvironmentId: 'staging',
      targetEnvironmentId: 'prod',
      sourceVersionId: 'v2',
      sourceVersionNumber: 2,
      incoming: [
        {
          locale: 'sv',
          translations: { save: 'Spara AI' },
          metadata: {
            save: { source: 'ai', status: 'ai', aiLocked: false },
          },
          keyCount: 1,
        },
      ],
      currentCells: new Map([
        [cellId('sv', 'save'), asManualTranslation('Spara manuellt')],
      ]),
      targetLocales: ['sv'],
      flagCount: 0,
    });

    expect(plan.conflictCount).toBe(1);
    expect(plan.applyCount).toBe(0);
    expect(plan.entries[0]).toMatchObject({
      action: 'skip-conflict',
      conflictReason: 'human-owned-target',
      incoming: 'Spara AI',
    });
  });

  it('lets a human-authored incoming cell overwrite a human-owned target', () => {
    const plan = planPromotion({
      sourceEnvironmentId: 'staging',
      targetEnvironmentId: 'prod',
      sourceVersionId: 'v2',
      sourceVersionNumber: 2,
      incoming: [
        {
          locale: 'sv',
          translations: { save: 'Spara nytt' },
          metadata: {
            save: { source: 'manual', status: 'manual', aiLocked: true },
          },
          keyCount: 1,
        },
      ],
      currentCells: new Map([
        [cellId('sv', 'save'), asManualTranslation('Spara manuellt')],
      ]),
      targetLocales: ['sv'],
      flagCount: 1,
    });

    expect(plan.applyCount).toBe(1);
    expect(plan.conflictCount).toBe(0);
    expect(plan.entries[0].action).toBe('apply');
  });

  it('applies when the target cell is AI-owned', () => {
    const plan = planPromotion({
      sourceEnvironmentId: 'staging',
      targetEnvironmentId: 'prod',
      sourceVersionId: 'v2',
      sourceVersionNumber: 2,
      incoming: [
        {
          locale: 'sv',
          translations: { save: 'Spara AI' },
          metadata: {
            save: { source: 'ai', status: 'ai', aiLocked: false },
          },
          keyCount: 1,
        },
      ],
      currentCells: new Map([
        [cellId('sv', 'save'), asAiTranslation('Gammal AI')],
      ]),
      targetLocales: ['sv'],
      flagCount: 0,
    });

    expect(plan.applyCount).toBe(1);
  });
});
