import { act, screen, userEvent } from '@testing-library/react-native';

import { AuthError } from '@/shared/auth/types';
import { deferred, mockedAuthService as service, resetAuth } from '@/test-utils/authTestUtils';
import { resetRouter, router, setParams } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import ResetPassword from './ResetPassword';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);
jest.mock('@/shared/auth/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    requestPasswordReset: jest.fn(),
    confirmPasswordReset: jest.fn(),
  },
}));

beforeEach(() => {
  resetRouter();
  resetAuth();
  setParams({ token: 'token-from-the-link' });
});

const renderScreen = async (language: 'en' | 'pl' = 'en') => {
  const user = userEvent.setup();
  await renderWithProviders(<ResetPassword />, { language });
  const [password, confirm] = language === 'en' ? ['New password', 'Confirm password'] : ['Nowe hasło', 'Powtórz hasło'];
  return {
    user,
    typePassword: (text: string) => user.type(screen.getByLabelText(password), text),
    typeConfirm: (text: string) => user.type(screen.getByLabelText(confirm), text),
  };
};

const saveButton = () => screen.getByRole('button', { name: /^(Save password|Saving)/ });

const fillValid = async (form: Awaited<ReturnType<typeof renderScreen>>) => {
  await form.typePassword('NewSecret456');
  await form.typeConfirm('NewSecret456');
};

describe('ResetPassword screen', () => {
  describe('opened with the link from the email', () => {
    it('asks for a new password, twice, with a strength meter', async () => {
      await renderScreen();

      expect(screen.getByRole('header', { name: 'Choose a new password' })).toBeVisible();
      expect(screen.getByLabelText('New password')).toBeVisible();
      expect(screen.getByLabelText('Confirm password')).toBeVisible();
      expect(screen.getByText('Use at least 8 characters, with letters and numbers.')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Save password' })).toBeVisible();
    });

    it('tells autofill that these are new passwords, and hides them', async () => {
      await renderScreen();

      for (const label of ['New password', 'Confirm password']) {
        expect(screen.getByLabelText(label).props).toMatchObject({
          autoComplete: 'new-password',
          textContentType: 'newPassword',
          secureTextEntry: true,
        });
      }
    });

    it('does not show the token anywhere', async () => {
      await renderScreen();
      expect(screen.queryByText(/token-from-the-link/)).toBeNull();
    });

    it('does not start out with errors', async () => {
      await renderScreen();
      expect(screen.queryByText('Use at least 8 characters')).toBeNull();
    });

    it('rates the password while it is typed', async () => {
      const { typePassword } = await renderScreen();
      await typePassword('Abcdefg1!');
      expect(screen.getByLabelText('Password strength: Strong')).toBeVisible();
    });

    describe('checking what was typed', () => {
      it('says when the password is too short, and does not call the server', async () => {
        const form = await renderScreen();
        await form.typePassword('Abc123');
        await form.typeConfirm('Abc123');

        await form.user.press(saveButton());

        expect(screen.getByText('Use at least 8 characters')).toBeVisible();
        expect(service.confirmPasswordReset).not.toHaveBeenCalled();
      });

      it('says when the password has no numbers', async () => {
        const form = await renderScreen();
        await form.typePassword('abcdefghij');
        await form.typeConfirm('abcdefghij');

        await form.user.press(saveButton());

        expect(screen.getByText('Use both letters and numbers')).toBeVisible();
      });

      it('says when the two passwords differ', async () => {
        const form = await renderScreen();
        await form.typePassword('NewSecret456');
        await form.typeConfirm('NewSecret457');

        await form.user.press(saveButton());

        expect(screen.getByText('The passwords do not match')).toBeVisible();
        expect(service.confirmPasswordReset).not.toHaveBeenCalled();
      });
    });

    describe('saving the new password', () => {
      it('sends the token from the link and the password as typed', async () => {
        service.confirmPasswordReset.mockResolvedValue();
        const form = await renderScreen();
        await fillValid(form);

        await form.user.press(saveButton());

        expect(service.confirmPasswordReset).toHaveBeenCalledTimes(1);
        expect(service.confirmPasswordReset).toHaveBeenCalledWith('token-from-the-link', 'NewSecret456');
      });

      it('can be done with the keyboard', async () => {
        service.confirmPasswordReset.mockResolvedValue();
        const form = await renderScreen();
        await form.typePassword('NewSecret456');

        await form.user.type(screen.getByLabelText('Confirm password'), 'NewSecret456', {
          submitEditing: true,
        });

        expect(service.confirmPasswordReset).toHaveBeenCalledTimes(1);
      });

      it('shows a spinner, locks the fields and ignores more taps while it waits', async () => {
        const request = deferred();
        service.confirmPasswordReset.mockReturnValue(request.promise);
        const form = await renderScreen();
        await fillValid(form);

        await form.user.press(saveButton());

        const button = screen.getByRole('button', { name: 'Saving…' });
        expect(button).toBeBusy();
        expect(button).toBeDisabled();
        expect(screen.getByLabelText('New password').props.editable).toBe(false);
        await form.user.press(button);
        expect(service.confirmPasswordReset).toHaveBeenCalledTimes(1);

        await act(async () => request.resolve());
      });

      it('then says the password was changed, and offers to log in', async () => {
        service.confirmPasswordReset.mockResolvedValue();
        const form = await renderScreen();
        await fillValid(form);

        await form.user.press(saveButton());

        expect(await screen.findByRole('header', { name: 'Password changed' })).toBeVisible();
        expect(screen.getByText('You can now log in with your new password.')).toBeVisible();
        expect(screen.queryByLabelText('New password')).toBeNull();

        await form.user.press(screen.getByRole('button', { name: 'Log in' }));
        expect(router.replace).toHaveBeenCalledWith('/login');
      });

      describe('when it fails', () => {
        const failWith = async (error: AuthError) => {
          service.confirmPasswordReset.mockRejectedValue(error);
          const form = await renderScreen();
          await fillValid(form);
          await form.user.press(saveButton());
          return form;
        };

        it('says the link has expired or was used, and keeps what was typed', async () => {
          await failWith(new AuthError('invalidResetToken'));

          expect(await screen.findByRole('alert')).toHaveTextContent(
            'This reset link has expired or was already used. Ask for a new one.',
          );
          expect(screen.getByLabelText('New password')).toHaveDisplayValue('NewSecret456');
          expect(screen.queryByText('Password changed')).toBeNull();
        });

        it('says when the server could not be reached', async () => {
          await failWith(new AuthError('network'));
          expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach the server/);
        });

        it('tells the user to wait after too many attempts', async () => {
          await failWith(new AuthError('rateLimited'));
          expect(await screen.findByRole('alert')).toHaveTextContent(/^Too many attempts/);
        });

        it('takes the message away when the user changes the password', async () => {
          const form = await failWith(new AuthError('invalidResetToken'));
          await screen.findByRole('alert');

          await form.typePassword('x');

          expect(screen.queryByRole('alert')).toBeNull();
        });

        it('lets the user try again', async () => {
          const form = await failWith(new AuthError('network'));
          await screen.findByRole('alert');
          service.confirmPasswordReset.mockResolvedValue();

          await form.user.press(saveButton());

          expect(await screen.findByText('Password changed')).toBeVisible();
        });
      });
    });

    it('offers a new link at any time, replacing this screen', async () => {
      const { user } = await renderScreen();

      await user.press(screen.getByRole('link', { name: 'Request a new one' }));

      expect(router.replace).toHaveBeenCalledWith('/forgot-password');
    });

    it('goes back', async () => {
      const { user } = await renderScreen();
      await user.press(screen.getByRole('button', { name: 'Back' }));
      expect(router.back).toHaveBeenCalledTimes(1);
    });
  });

  describe('opened without a token', () => {
    it.each([
      ['no token', {}],
      ['an empty token', { token: '' }],
      ['a token of spaces', { token: '   ' }],
    ])('says the link is not valid, with %s, and offers a new one', async (_name, params) => {
      setParams(params);
      const user = userEvent.setup();
      await renderWithProviders(<ResetPassword />);

      expect(screen.getByRole('header', { name: 'This link is not valid' })).toBeVisible();
      expect(screen.queryByLabelText('New password')).toBeNull();

      await user.press(screen.getByRole('button', { name: 'Request a new link' }));
      expect(router.replace).toHaveBeenCalledWith('/forgot-password');
      expect(service.confirmPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('the token in the link', () => {
    it('is trimmed', async () => {
      setParams({ token: '  spaced-token  ' });
      service.confirmPasswordReset.mockResolvedValue();
      const form = await renderScreen();
      await fillValid(form);

      await form.user.press(saveButton());

      expect(service.confirmPasswordReset).toHaveBeenCalledWith('spaced-token', 'NewSecret456');
    });

    it('uses the first one when the link holds several', async () => {
      setParams({ token: ['first', 'second'] as unknown as string });
      service.confirmPasswordReset.mockResolvedValue();
      const form = await renderScreen();
      await fillValid(form);

      await form.user.press(saveButton());

      expect(service.confirmPasswordReset).toHaveBeenCalledWith('first', 'NewSecret456');
    });
  });

  it('is in Polish when the app is', async () => {
    service.confirmPasswordReset.mockResolvedValue();
    const form = await renderScreen('pl');

    expect(screen.getByRole('header', { name: 'Wybierz nowe hasło' })).toBeVisible();
    await form.typePassword('NowaTajne456');
    await form.typeConfirm('NowaTajne456');
    await form.user.press(screen.getByRole('button', { name: 'Zapisz hasło' }));

    expect(await screen.findByRole('header', { name: 'Hasło zostało zmienione' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeVisible();
  });
});
