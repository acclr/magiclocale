import {
  canAddProjectLocale,
  localeLimitMessage,
  STARTER_MAX_LOCALES,
} from '../../../domain/billing';

describe('locale limits', () => {
  it('caps starter projects at four languages and leaves enterprise uncapped', () => {
    expect(canAddProjectLocale(3, STARTER_MAX_LOCALES)).toBe(true);
    expect(canAddProjectLocale(4, STARTER_MAX_LOCALES)).toBe(false);
    expect(canAddProjectLocale(20, null)).toBe(true);
    expect(localeLimitMessage(STARTER_MAX_LOCALES)).toContain('Enterprise');
  });
});
