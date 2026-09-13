import { createHash } from 'crypto';

import {
  bucketOf,
  coerceToType,
  evaluateFlag,
} from '../../../domain/flags/evaluate';
import type { FlagSnapshot } from '../../../domain/flags/types';

function flag(overrides: Partial<FlagSnapshot> = {}): FlagSnapshot {
  return {
    key: 'checkout-v2',
    type: 'boolean',
    visibility: 'public',
    enabled: true,
    defaultValue: true,
    offValue: false,
    rolloutPercentage: null,
    rolloutSalt: 'salt',
    rules: [],
    ...overrides,
  };
}

describe('bucketOf', () => {
  it('matches Node SHA-1 of the first 32 bits mapped to 0-100', () => {
    const seed = 'salt:checkout-v2:user-1';
    const digest = createHash('sha1').update(seed).digest();
    const expected = (digest.readUInt32BE(0) / 0x100000000) * 100;
    expect(bucketOf(seed)).toBeCloseTo(expected, 10);
  });

  it('is stable for the same seed', () => {
    expect(bucketOf('a:b:c')).toBe(bucketOf('a:b:c'));
  });
});

describe('evaluateFlag', () => {
  it('returns the caller fallback when the flag is missing', () => {
    expect(evaluateFlag(null, {}, 'fallback')).toMatchObject({
      value: 'fallback',
      reason: 'flag-not-found',
    });
  });

  it('returns offValue when the flag is disabled', () => {
    expect(evaluateFlag(flag({ enabled: false }))).toMatchObject({
      value: false,
      reason: 'disabled',
    });
  });

  it('uses the first matching rule', () => {
    const snapshot = flag({
      rules: [
        {
          attribute: 'email',
          operator: 'ends-with',
          values: ['@acme.test'],
          value: false,
          rolloutPercentage: null,
        },
        {
          attribute: 'plan',
          operator: 'equals',
          values: ['pro'],
          value: true,
          rolloutPercentage: null,
        },
      ],
    });

    expect(
      evaluateFlag(snapshot, {
        key: 'u1',
        attributes: { email: 'dev@acme.test', plan: 'pro' },
      })
    ).toMatchObject({ value: false, reason: 'rule-match', ruleIndex: 0 });
  });

  it('does not match a missing attribute, including negated operators', () => {
    const snapshot = flag({
      defaultValue: true,
      rules: [
        {
          attribute: 'email',
          operator: 'not-equals',
          values: ['blocked@acme.test'],
          value: false,
          rolloutPercentage: null,
        },
      ],
    });

    expect(evaluateFlag(snapshot, { key: 'anon' })).toMatchObject({
      value: true,
      reason: 'default',
    });
  });

  it('applies flag-level rollout after rules miss', () => {
    const snapshot = flag({
      rolloutPercentage: 0,
      defaultValue: true,
      offValue: false,
    });
    expect(evaluateFlag(snapshot, { key: 'user' })).toMatchObject({
      value: false,
      reason: 'rollout-excluded',
    });
    expect(
      evaluateFlag(flag({ ...snapshot, rolloutPercentage: 100 }), { key: 'user' })
    ).toMatchObject({
      value: true,
      reason: 'rollout-included',
    });
  });

  it('coerces values to the flag type', () => {
    expect(coerceToType('1', 'boolean')).toBe(true);
    expect(coerceToType('12', 'number')).toBe(12);
    expect(coerceToType(12, 'string')).toBe('12');
  });
});
