import { act, screen, userEvent } from '@testing-library/react-native';

import { useSessionStore } from '@/shared/auth/sessionStore';
import { AuthError } from '@/shared/auth/types';
import {
  annaResult,
  deferred,
  mockedAuthService as service,
  resetAuth,
} from '@/test-utils/authTestUtils';
import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import Login from './Login';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);
jest.mock('@/shared/auth/authService', () => ({
  authService: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    requestPasswordReset: jest.fn(),
  },
}));

beforeEach(() => {
  resetRouter();
  resetAuth();
});

// Renders the screen and gives back a user, and a way to fill in the form.
const renderLogin = async (language: 'en' | 'pl' = 'en') => {
  const user = userEvent.setup();
  await renderWithProviders(<Login />, { language });
  const emailLabel = language === 'en' ? 'Email' : 'E-mail';
  const passwordLabel = language === 'en' ? 'Password' : 'Hasło';
  return {
    user,
    typeEmail: (text: string) => user.type(screen.getByLabelText(emailLabel), text),
    typePassword: (text: string) => user.type(screen.getByLabelText(passwordLabel), text),
  };
};

const logInButton = () => screen.getByRole('button', { name: /^Log(ging)? in/ });

describe('Login screen', () => {
  it('shows the form with a way to reset the password and to create an account', async () => {
    await renderLogin();

    expect(screen.getByRole('header', { name: 'Welcome back' })).toBeVisible();
    expect(screen.getByLabelText('Email')).toBeVisible();
    expect(screen.getByLabelText('Password')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Log in' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Forgot password?' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Create one' })).toBeVisible();
  });

  it('does not start out with errors', async () => {
    await renderLogin();

    expect(screen.queryByText('Enter your email address')).toBeNull();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  describe('the fields', () => {
    it('tell password managers and autofill what they are for', async () => {
      await renderLogin();

      expect(screen.getByLabelText('Email').props).toMatchObject({
        autoComplete: 'email',
        textContentType: 'username',
        keyboardType: 'email-address',
        autoCapitalize: 'none',
        autoCorrect: false,
      });
      expect(screen.getByLabelText('Password').props).toMatchObject({
        autoComplete: 'current-password',
        textContentType: 'password',
      });
    });

    it('hide the password until it is asked to be shown', async () => {
      const { user } = await renderLogin();
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);

      await user.press(screen.getByRole('button', { name: 'Show password' }));
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);

      await user.press(screen.getByRole('button', { name: 'Hide password' }));
      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(true);
    });
  });

  describe('checking what was typed', () => {
    it('asks for both fields and does not call the service', async () => {
      const { user } = await renderLogin();

      await user.press(logInButton());

      expect(screen.getByText('Enter your email address')).toBeVisible();
      expect(screen.getByText('Enter your password')).toBeVisible();
      expect(service.signIn).not.toHaveBeenCalled();
    });

    it('says when the email is not valid', async () => {
      const { user, typeEmail, typePassword } = await renderLogin();
      await typeEmail('anna');
      await typePassword('secret');

      await user.press(logInButton());

      expect(screen.getByText('Enter a valid email address')).toBeVisible();
      expect(service.signIn).not.toHaveBeenCalled();
    });

    it('takes the errors away as the fields are fixed', async () => {
      const { user, typeEmail } = await renderLogin();
      await user.press(logInButton());
      expect(screen.getByText('Enter your email address')).toBeVisible();

      await typeEmail('anna@example.com');

      expect(screen.queryByText('Enter your email address')).toBeNull();
    });
  });

  describe('logging in', () => {
    it('sends the email, cleaned up, and the password exactly as typed', async () => {
      service.signIn.mockResolvedValue(annaResult);
      const { user, typeEmail, typePassword } = await renderLogin();
      await typeEmail('  Anna@Example.COM ');
      await typePassword(' Secret 123 ');

      await user.press(logInButton());

      expect(service.signIn).toHaveBeenCalledTimes(1);
      expect(service.signIn).toHaveBeenCalledWith({
        email: 'anna@example.com',
        password: ' Secret 123 ',
      });
    });

    it('signs the user in, which is what moves them into the app', async () => {
      service.signIn.mockResolvedValue(annaResult);
      const { user, typeEmail, typePassword } = await renderLogin();
      await typeEmail('anna@example.com');
      await typePassword('Secret123');

      await user.press(logInButton());

      expect(useSessionStore.getState()).toMatchObject({ status: 'signedIn', user: annaResult.user });
    });

    it('can be done with the keyboard: the submit key of the password field logs in', async () => {
      service.signIn.mockResolvedValue(annaResult);
      const { typeEmail, user } = await renderLogin();
      await typeEmail('anna@example.com');

      await user.type(screen.getByLabelText('Password'), 'Secret123', { submitEditing: true });

      expect(service.signIn).toHaveBeenCalledTimes(1);
    });

    describe('while waiting for the answer', () => {
      it('shows a spinner on the button, locks the fields and ignores more taps', async () => {
        const request = deferred<typeof annaResult>();
        service.signIn.mockReturnValue(request.promise);
        const { user, typeEmail, typePassword } = await renderLogin();
        await typeEmail('anna@example.com');
        await typePassword('Secret123');

        await user.press(logInButton());

        const button = screen.getByRole('button', { name: 'Logging in…' });
        expect(button).toBeBusy();
        expect(button).toBeDisabled();
        expect(screen.getByLabelText('Email').props.editable).toBe(false);
        expect(screen.getByLabelText('Password').props.editable).toBe(false);

        await user.press(button);
        await user.press(button);
        expect(service.signIn).toHaveBeenCalledTimes(1);

        await act(async () => request.resolve(annaResult));
      });

      it('gives the button and the fields back once the answer came', async () => {
        const request = deferred<typeof annaResult>();
        service.signIn.mockReturnValue(request.promise);
        const { user, typeEmail, typePassword } = await renderLogin();
        await typeEmail('anna@example.com');
        await typePassword('Secret123');
        await user.press(logInButton());

        request.reject(new AuthError('invalidCredentials'));

        expect(await screen.findByRole('button', { name: 'Log in' })).not.toBeBusy();
        expect(screen.getByLabelText('Email').props.editable).toBe(true);
      });
    });

    describe('when it fails', () => {
      const failWith = async (error: AuthError) => {
        service.signIn.mockRejectedValue(error);
        const screenHelpers = await renderLogin();
        await screenHelpers.typeEmail('anna@example.com');
        await screenHelpers.typePassword('Secret123');
        await screenHelpers.user.press(logInButton());
        return screenHelpers;
      };

      it('says the email or password is wrong, without saying which', async () => {
        await failWith(new AuthError('invalidCredentials'));

        expect(await screen.findByRole('alert')).toHaveTextContent('Wrong email or password');
        expect(useSessionStore.getState().status).toBe('signedOut');
      });

      it('says when the server could not be reached', async () => {
        await failWith(new AuthError('network'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Could not reach the server. Check your connection and try again.',
        );
      });

      it('tells the user to wait when there have been too many attempts', async () => {
        await failWith(new AuthError('rateLimited'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Too many attempts. Wait a minute and try again.',
        );
      });

      it('gives a general message for anything else', async () => {
        await failWith(new AuthError('unknown'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'Something went wrong. Please try again.',
        );
      });

      it('takes the message away when the user starts to correct the form', async () => {
        const { typePassword } = await failWith(new AuthError('invalidCredentials'));
        expect(await screen.findByRole('alert')).toBeVisible();

        await typePassword('x');

        expect(screen.queryByRole('alert')).toBeNull();
      });

      it('lets the user try again', async () => {
        const { user } = await failWith(new AuthError('invalidCredentials'));
        await screen.findByRole('alert');
        service.signIn.mockResolvedValue(annaResult);

        await user.press(logInButton());

        expect(service.signIn).toHaveBeenCalledTimes(2);
        expect(useSessionStore.getState().status).toBe('signedIn');
      });
    });
  });

  describe('navigation', () => {
    it('goes to the password reset', async () => {
      const { user } = await renderLogin();

      await user.press(screen.getByRole('link', { name: 'Forgot password?' }));

      expect(router.push).toHaveBeenCalledWith('/forgot-password');
    });

    it('swaps this screen for sign up, so back does not return to a screen the user left', async () => {
      const { user } = await renderLogin();

      await user.press(screen.getByRole('link', { name: 'Create one' }));

      expect(router.replace).toHaveBeenCalledWith('/sign-up');
    });

    it('goes back', async () => {
      const { user } = await renderLogin();

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it('goes to the welcome screen when there is nothing to go back to', async () => {
      router.canGoBack.mockReturnValue(false);
      const { user } = await renderLogin();

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.replace).toHaveBeenCalledWith('/welcome');
    });
  });

  it('is in Polish when the app is', async () => {
    const { user } = await renderLogin('pl');

    expect(screen.getByRole('header', { name: 'Witaj ponownie' })).toBeVisible();
    await user.press(screen.getByRole('button', { name: 'Zaloguj się' }));
    expect(screen.getByText('Podaj adres e-mail')).toBeVisible();
    expect(screen.getByText('Podaj hasło')).toBeVisible();
  });
});
