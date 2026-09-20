import {
  PREMIUM_MAX_ENVIRONMENTS,
  PREMIUM_MAX_FLAGS,
  PREMIUM_MAX_LOCALES,
  canAddEnvironment,
  canAddFlag,
  canAddProjectLocale,
  localeLimitMessage,
} from '../../../domain/billing';

describe('billing limits', () => {
  it('caps premium projects at six languages and leaves enterprise uncapped', () => {
    expect(canAddProjectLocale(5, PREMIUM_MAX_LOCALES)).toBe(true);
    expect(canAddProjectLocale(6, PREMIUM_MAX_LOCALES)).toBe(false);
    expect(canAddProjectLocale(20, null)).toBe(true);
    expect(localeLimitMessage(PREMIUM_MAX_LOCALES)).toContain('6');
  });

  it('caps premium environments and flags', () => {
    expect(canAddEnvironment(1, PREMIUM_MAX_ENVIRONMENTS)).toBe(true);
    expect(canAddEnvironment(2, PREMIUM_MAX_ENVIRONMENTS)).toBe(false);
    expect(canAddFlag(49, PREMIUM_MAX_FLAGS)).toBe(true);
    expect(canAddFlag(50, PREMIUM_MAX_FLAGS)).toBe(false);
    expect(canAddFlag(100, null)).toBe(true);
  });
});
