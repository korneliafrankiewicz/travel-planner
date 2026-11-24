import {
  validateForgotPassword,
  validateLogIn,
  validateSignUp,
  type SignUpValues,
} from './authSchemas';

const signUp: SignUpValues = {
  name: '  Anna Nowak ',
  email: '  Anna.Nowak@Example.COM ',
  password: 'Secret123',
  confirmPassword: 'Secret123',
  acceptTerms: true,
};

const signUpErrors = (override: Partial<SignUpValues>) => {
  const result = validateSignUp({ ...signUp, ...override });
  return result.success ? null : result.errors;
};

describe('email', () => {
  it.each(['a@b.co', 'anna.nowak@example.com', 'a+tag@sub.example.org', 'x_y-z@e.io'])(
    'accepts %p',
    (email) => {
      expect(validateForgotPassword({ email }).success).toBe(true);
    },
  );

  it.each(['', '   '])('is required: %p', (email) => {
    expect(validateForgotPassword({ email })).toEqual({
      success: false,
      errors: { email: 'errors.emailRequired' },
    });
  });

  it.each(['anna', 'anna@', '@example.com', 'anna@example', 'anna@example.c', 'an na@example.com', 'a@@b.com'])(
    'rejects %p as not valid',
    (email) => {
      expect(validateForgotPassword({ email })).toEqual({
        success: false,
        errors: { email: 'errors.emailInvalid' },
      });
    },
  );

  it('rejects an address that is far too long', () => {
    const email = `${'a'.repeat(250)}@example.com`;
    expect(validateForgotPassword({ email }).success).toBe(false);
  });

  it('is trimmed and lower-cased, so the same address is always the same', () => {
    expect(validateForgotPassword({ email: '  Anna@Example.com ' })).toEqual({
      success: true,
      data: { email: 'anna@example.com' },
    });
  });
});

describe('validateLogIn', () => {
  it('accepts an email and a password, and cleans the email', () => {
    expect(validateLogIn({ email: ' A@B.co ', password: 'x' })).toEqual({
      success: true,
      data: { email: 'a@b.co', password: 'x' },
    });
  });

  it('asks for both when both are empty', () => {
    expect(validateLogIn({ email: '', password: '' })).toEqual({
      success: false,
      errors: { email: 'errors.emailRequired', password: 'errors.passwordRequired' },
    });
  });

  it('does not apply the rules for a new password: an old, weak one must keep working', () => {
    expect(validateLogIn({ email: 'a@b.co', password: '1' }).success).toBe(true);
  });

  it('never changes the password, spaces included', () => {
    const result = validateLogIn({ email: 'a@b.co', password: '  Secret 123  ' });
    expect(result.success && result.data.password).toBe('  Secret 123  ');
  });
});

describe('validateSignUp', () => {
  it('accepts valid values and cleans the name and the email', () => {
    expect(validateSignUp(signUp)).toEqual({
      success: true,
      data: {
        name: 'Anna Nowak',
        email: 'anna.nowak@example.com',
        password: 'Secret123',
        confirmPassword: 'Secret123',
        acceptTerms: true,
      },
    });
  });

  it('asks for everything on an empty form', () => {
    expect(
      validateSignUp({ name: '', email: '', password: '', confirmPassword: '', acceptTerms: false }),
    ).toEqual({
      success: false,
      errors: {
        name: 'errors.nameRequired',
        email: 'errors.emailRequired',
        password: 'errors.passwordTooShort',
        acceptTerms: 'errors.termsRequired',
      },
    });
  });

  describe('name', () => {
    it.each(['', '   '])('is required: %p', (name) => {
      expect(signUpErrors({ name })).toEqual({ name: 'errors.nameRequired' });
    });

    it('is limited in length', () => {
      expect(signUpErrors({ name: 'a'.repeat(81) })).toEqual({ name: 'errors.nameRequired' });
      expect(signUpErrors({ name: 'a'.repeat(80) })).toBeNull();
    });
  });

  describe('password', () => {
    it.each(['Abc123', 'a1', '1234567'])('must be at least 8 characters: %p', (password) => {
      expect(signUpErrors({ password, confirmPassword: password })).toEqual({
        password: 'errors.passwordTooShort',
      });
    });

    it.each(['abcdefgh', 'ABCDEFGH', '12345678', '!!!!!!!!'])(
      'must have both letters and numbers: %p',
      (password) => {
        expect(signUpErrors({ password, confirmPassword: password })).toEqual({
          password: 'errors.passwordTooWeak',
        });
      },
    );

    it('may contain spaces and symbols, and is not trimmed', () => {
      const password = ' pass word 1! ';
      const result = validateSignUp({ ...signUp, password, confirmPassword: password });
      expect(result.success && result.data.password).toBe(password);
    });

    it('accepts letters other than English ones next to a number', () => {
      expect(signUpErrors({ password: 'Zażółć123', confirmPassword: 'Zażółć123' })).toBeNull();
    });
  });

  describe('confirm password', () => {
    it('must be the same as the password', () => {
      expect(signUpErrors({ confirmPassword: 'Secret124' })).toEqual({
        confirmPassword: 'errors.passwordsDoNotMatch',
      });
    });

    it('is compared exactly, so a difference in case or spaces counts', () => {
      expect(signUpErrors({ confirmPassword: 'secret123' })).toEqual({
        confirmPassword: 'errors.passwordsDoNotMatch',
      });
      expect(signUpErrors({ confirmPassword: 'Secret123 ' })).toEqual({
        confirmPassword: 'errors.passwordsDoNotMatch',
      });
    });

    it('must be empty-checked too: an empty confirmation does not match a password', () => {
      expect(signUpErrors({ confirmPassword: '' })).toEqual({
        confirmPassword: 'errors.passwordsDoNotMatch',
      });
    });
  });

  describe('terms', () => {
    it('must be accepted', () => {
      expect(signUpErrors({ acceptTerms: false })).toEqual({ acceptTerms: 'errors.termsRequired' });
    });
  });

  it('reports at most one error per field', () => {
    const errors = signUpErrors({ email: '', password: '', confirmPassword: 'x', name: '' });
    expect(errors).not.toBeNull();
    for (const value of Object.values(errors ?? {})) {
      expect(typeof value).toBe('string');
    }
    expect(Object.keys(errors ?? {}).sort()).toEqual(['confirmPassword', 'email', 'name', 'password']);
  });
});
