import { AuthError } from '@/shared/auth/types';

import { toFormErrorKey } from './authErrors';

describe('toFormErrorKey', () => {
  it.each([
    ['invalidCredentials', 'formErrors.invalidCredentials'],
    ['emailTaken', 'formErrors.emailTaken'],
    ['network', 'formErrors.network'],
    ['unknown', 'formErrors.unknown'],
  ] as const)('maps %s to %s', (code, key) => {
    expect(toFormErrorKey(new AuthError(code))).toBe(key);
  });

  it('gives the general message for a session that is not valid', () => {
    expect(toFormErrorKey(new AuthError('invalidSession'))).toBe('formErrors.unknown');
  });

  it.each([new TypeError('boom'), 'text', null, undefined, { code: 'network' }])(
    'gives the general message for something that is not an AuthError: %p',
    (error) => {
      expect(toFormErrorKey(error)).toBe('formErrors.unknown');
    },
  );
});
