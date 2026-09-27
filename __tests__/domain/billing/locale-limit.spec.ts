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

  it('caps free environments and flags and leaves paid plans open', () => {
    expect(canAddEnvironment(0, FREE_MAX_ENVIRONMENTS)).toBe(true);
    expect(canAddEnvironment(1, FREE_MAX_ENVIRONMENTS)).toBe(false);
    expect(canAddFlag(9, FREE_MAX_FLAGS)).toBe(true);
    expect(canAddFlag(10, FREE_MAX_FLAGS)).toBe(false);
    expect(canAddFlag(100, null)).toBe(true);
  });
});
