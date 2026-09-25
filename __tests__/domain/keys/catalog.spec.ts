import {
  extractVariables,
  validateVariables,
} from '../../../domain/keys/variables';
import {
  namespaceFromKey,
  namespaceDepth,
  rootNamespace,
} from '../../../domain/keys/namespace';
import { parseSearchQuery } from '../../../domain/keys/search';
import { analyzeArchitecture } from '../../../domain/architecture/analyzer';
import { cleanupOperationsForFinding } from '../../../domain/architecture/cleanup';
import { flattenTranslationJson } from '../../../domain/migrations/import-json';
import { compareEnvironments } from '../../../domain/environments/compare';
import type { KeyMeta } from '../../../domain/keys/types';

function meta(
  partial: Partial<KeyMeta> & Pick<KeyMeta, 'key' | 'type'>
): KeyMeta {
  return {
    id: partial.id ?? partial.key,
    projectId: 'project',
    namespace: namespaceFromKey(partial.key),
    description: null,
    developerNote: null,
    owner: null,
    tags: [],
    lifecycle: 'active',
    lastDetectedAt: null,
    replacementKey: null,
    reviewAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    usageCount: 0,
    ...partial,
  };
}

describe('key catalog helpers', () => {
  it('derives namespaces from dotted keys', () => {
    expect(namespaceFromKey('billing.invoice.download')).toBe(
      'billing.invoice'
    );
    expect(namespaceFromKey('save')).toBeNull();
    expect(namespaceDepth('billing.invoice')).toBe(2);
    expect(rootNamespace('billing.invoice.download')).toBe('billing');
  });

  it('validates interpolation variables', () => {
    expect(extractVariables('Hello {{name}}')).toEqual(['name']);
    expect(validateVariables('Hello {{name}}', 'Hej')).toEqual([
      { kind: 'missing', name: 'name' },
    ]);
    expect(validateVariables('Hello {{name}}', 'Hej {{username}}')).toEqual([
      { kind: 'missing', name: 'name' },
      { kind: 'unexpected', name: 'username' },
    ]);
  });

  it('parses fielded search', () => {
    expect(
      parseSearchQuery('namespace:billing locale:de status:missing')
    ).toEqual({
      text: '',
      fields: {
        namespace: 'billing',
        locale: 'de',
        status: 'missing',
      },
    });
    expect(parseSearchQuery('Delete account namespace:settings')).toMatchObject(
      {
        text: 'delete account',
        fields: { namespace: 'settings' },
      }
    );
  });
});

describe('architecture analyzer', () => {
  it('reports unused keys, missing owners, and duplicate source text', () => {
    const findings = analyzeArchitecture({
      keys: [
        meta({ key: 'billing.save', type: 'translation', usageCount: 0 }),
        meta({ key: 'settings.save', type: 'translation', usageCount: 1 }),
        meta({ key: 'newCheckout', type: 'feature-flag', usageCount: 1 }),
      ],
      usagesByKeyId: {
        'billing.save': [],
        'settings.save': [
          {
            id: 'u',
            keyMetaId: 'settings.save',
            file: 'src/features/settings/Page.tsx',
            line: 1,
            column: 0,
            repository: null,
            branch: null,
            lastSeenAt: new Date(),
          },
        ],
        newCheckout: [
          {
            id: 'u2',
            keyMetaId: 'newCheckout',
            file: 'src/features/billing/Checkout.tsx',
            line: 4,
            column: 0,
            repository: null,
            branch: null,
            lastSeenAt: new Date(),
          },
        ],
      },
      translationSourceText: {
        'billing.save': 'Save',
        'settings.save': 'Save',
      },
      definedFlagKeys: new Set(),
      productionEnabledSince: {},
      rules: { requiredOwner: true, minDepth: 1 },
    });

    expect(findings.map((item) => item.kind)).toEqual(
      expect.arrayContaining([
        'unused-key',
        'missing-owner',
        'duplicate-translation',
        'unknown-flag',
        'naming-issue',
      ])
    );
  });

  it('flags production-off flags that still have usages', () => {
    const now = new Date('2026-09-18T00:00:00.000Z');
    const findings = analyzeArchitecture({
      keys: [
        meta({
          id: 'old',
          key: 'checkout.redesign',
          type: 'feature-flag',
          usageCount: 2,
        }),
      ],
      usagesByKeyId: {},
      translationSourceText: {},
      definedFlagKeys: new Set(['checkout.redesign']),
      productionEnabledSince: {},
      productionDisabledSince: {
        'checkout.redesign': new Date('2026-01-01T00:00:00.000Z'),
      },
      rules: { staleEnabledDays: 90 },
      now,
    });
    expect(findings.map((item) => item.kind)).toContain('stale-flag');
  });

  it('maps unused findings to archive cleanup operations', () => {
    expect(
      cleanupOperationsForFinding(
        { kind: 'unused-key' },
        meta({ key: 'billing.save', type: 'translation' })
      )
    ).toEqual({
      type: 'archive-key',
      keyType: 'translation',
      fromKey: 'billing.save',
    });
  });
});

describe('import and compare', () => {
  it('flattens nested translation JSON', () => {
    expect(
      flattenTranslationJson({
        common: { save: 'Save' },
        billing: { title: 'Invoice' },
      })
    ).toEqual([
      { key: 'common.save', sourceText: 'Save' },
      { key: 'billing.title', sourceText: 'Invoice' },
    ]);
  });

  it('diffs flag environments', () => {
    const environment = {
      id: 'prod',
      projectId: 'p',
      slug: 'production',
      name: 'Production',
      isProduction: true,
      liveVersionId: null,
      parentEnvironmentId: null,
    };
    const staging = {
      ...environment,
      id: 'stg',
      slug: 'staging',
      name: 'Staging',
      isProduction: false,
    };
    const result = compareEnvironments({
      left: staging,
      right: environment,
      leftFlags: [
        {
          flag: {
            id: 'f',
            projectId: 'p',
            key: 'dashboard.redesign',
            name: 'Dashboard',
            description: null,
            type: 'boolean',
            visibility: 'public',
            archived: false,
          },
          config: {
            id: 'c1',
            flagId: 'f',
            environmentId: 'stg',
            enabled: true,
            defaultValue: true,
            offValue: false,
            rolloutPercentage: null,
            rolloutSalt: 's',
            inherited: false,
            rules: [],
          },
        },
      ],
      rightFlags: [
        {
          flag: {
            id: 'f',
            projectId: 'p',
            key: 'dashboard.redesign',
            name: 'Dashboard',
            description: null,
            type: 'boolean',
            visibility: 'public',
            archived: false,
          },
          config: {
            id: 'c2',
            flagId: 'f',
            environmentId: 'prod',
            enabled: false,
            defaultValue: true,
            offValue: false,
            rolloutPercentage: null,
            rolloutSalt: 's',
            inherited: false,
            rules: [],
          },
        },
      ],
      keys: [],
      leftTranslations: [],
      rightTranslations: [],
    });
    expect(result.flags).toEqual([
      {
        key: 'dashboard.redesign',
        left: { enabled: true, inherited: false },
        right: { enabled: false, inherited: false },
      },
    ]);
  });
});
