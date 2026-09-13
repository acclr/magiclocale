import {
  canAddEnvironment,
  canAddFlag,
  canAddProjectLocale,
  localeLimitMessage,
  STARTER_MAX_ENVIRONMENTS,
  STARTER_MAX_FLAGS,
  STARTER_MAX_LOCALES,
} from '../../../domain/billing';

describe('locale limits', () => {
  it('caps starter projects at four languages and leaves enterprise uncapped', () => {
    expect(canAddProjectLocale(3, STARTER_MAX_LOCALES)).toBe(true);
    expect(canAddProjectLocale(4, STARTER_MAX_LOCALES)).toBe(false);
    expect(canAddProjectLocale(20, null)).toBe(true);
    expect(localeLimitMessage(STARTER_MAX_LOCALES)).toContain('Enterprise');
  });

  it('caps starter environments and flags', () => {
    expect(canAddEnvironment(1, STARTER_MAX_ENVIRONMENTS)).toBe(true);
    expect(canAddEnvironment(2, STARTER_MAX_ENVIRONMENTS)).toBe(false);
    expect(canAddFlag(24, STARTER_MAX_FLAGS)).toBe(true);
    expect(canAddFlag(25, STARTER_MAX_FLAGS)).toBe(false);
    expect(canAddFlag(100, null)).toBe(true);
  });
});
