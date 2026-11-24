import { getPasswordStrength } from './passwordStrength';

describe('getPasswordStrength', () => {
  it('has nothing to rate for an empty password', () => {
    expect(getPasswordStrength('')).toBeNull();
  });

  it.each(['a', 'abc12', 'Abc1!x', 'A1!a', 'Zz9!zZ9'])('rates the short password %p as weak, however varied', (password) => {
    expect(getPasswordStrength(password)).toBe('weak');
  });

  it.each(['abcdefgh', 'password', '12345678', 'abcdefgh1', 'abcdefghijkl'])(
    'rates the plain password %p as weak',
    (password) => {
      expect(getPasswordStrength(password)).toBe('weak');
    },
  );

  it.each(['Abcdefg1', 'abcdefg1!', 'abcdefghijkl1'])('rates %p as fair', (password) => {
    expect(getPasswordStrength(password)).toBe('fair');
  });

  it.each(['Abcdefg1!', 'abcdefghij1!', 'Correct-Horse-9', 'aB3$aB3$aB3$aB3$'])('rates %p as strong', (password) => {
    expect(getPasswordStrength(password)).toBe('strong');
  });

  it('counts a space as a symbol, because a password may contain spaces', () => {
    expect(getPasswordStrength('Abcdefg1 ')).toBe('strong');
  });

  it('never gets weaker when characters are added', () => {
    const rank = { weak: 0, fair: 1, strong: 2 } as const;
    let previous = 0;
    for (const password of ['Ab1', 'Abcdefg1', 'Abcdefg1!', 'Abcdefg1!Abcdefg1!']) {
      const strength = getPasswordStrength(password);
      expect(strength).not.toBeNull();
      expect(rank[strength!]).toBeGreaterThanOrEqual(previous);
      previous = rank[strength!];
    }
  });
});
