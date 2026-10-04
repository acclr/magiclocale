import {
  FREE_MAX_ENVIRONMENTS,
  FREE_MAX_FLAGS,
  FREE_MAX_LOCALES,
  PREMIUM_MAX_LOCALES,
  canAddEnvironment,
  canAddFlag,
  canAddProjectLocale,
  localeLimitMessage,
} from '../../../domain/billing';

describe('billing limits', () => {
  it('caps free projects at three languages and leaves Pro uncapped', () => {
    expect(canAddProjectLocale(2, FREE_MAX_LOCALES)).toBe(true);
    expect(canAddProjectLocale(3, FREE_MAX_LOCALES)).toBe(false);
    expect(PREMIUM_MAX_LOCALES).toBeNull();
    expect(canAddProjectLocale(20, PREMIUM_MAX_LOCALES)).toBe(true);
    expect(localeLimitMessage(FREE_MAX_LOCALES)).toContain('3');
  });

  it('does not cap free environments or flags from the plan', () => {
    expect(FREE_MAX_ENVIRONMENTS).toBeNull();
    expect(FREE_MAX_FLAGS).toBeNull();
    expect(canAddEnvironment(2, FREE_MAX_ENVIRONMENTS)).toBe(true);
    expect(canAddFlag(11, FREE_MAX_FLAGS)).toBe(true);
    expect(canAddFlag(100, null)).toBe(true);
  });
});
