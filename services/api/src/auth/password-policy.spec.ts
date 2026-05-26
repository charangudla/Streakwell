import { validatePassword } from './password-policy';

describe('validatePassword', () => {
  it('accepts a password that satisfies every rule', () => {
    expect(validatePassword('Vital30!secure')).toEqual({ ok: true });
  });

  it.each([
    ['undefined', undefined, 'Password is required.'],
    ['empty', '', 'at least 8'],
    ['too short', 'A1!aaaa', 'at least 8'],
    ['no lowercase', 'PASSWORD1!', 'lowercase'],
    ['no uppercase', 'password1!', 'uppercase'],
    ['no number', 'Password!', 'a number'],
    ['no symbol', 'Password1', 'symbol'],
  ])('rejects "%s"', (_label, input, expectedFragment) => {
    const result = validatePassword(input);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason.toLowerCase()).toContain(
        expectedFragment.toLowerCase(),
      );
    }
  });

  it('rejects passwords longer than 128 characters', () => {
    const long = 'Aa1!' + 'a'.repeat(125);
    const result = validatePassword(long);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/128/);
    }
  });

  it('accepts unicode and emoji as the symbol requirement', () => {
    expect(validatePassword('Vital30★passcode')).toEqual({ ok: true });
  });
});
