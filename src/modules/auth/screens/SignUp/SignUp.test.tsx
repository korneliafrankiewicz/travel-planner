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

import SignUp from './SignUp';

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

const renderSignUp = async (language: 'en' | 'pl' = 'en') => {
  const user = userEvent.setup();
  await renderWithProviders(<SignUp />, { language });
  return {
    user,
    typeName: (text: string) => user.type(screen.getByLabelText('Name'), text),
    typeEmail: (text: string) => user.type(screen.getByLabelText('Email'), text),
    typePassword: (text: string) => user.type(screen.getByLabelText('Password'), text),
    typeConfirm: (text: string) => user.type(screen.getByLabelText('Confirm password'), text),
    acceptTerms: () => user.press(screen.getByRole('checkbox')),
  };
};

type Form = Awaited<ReturnType<typeof renderSignUp>>;

const fillValidForm = async (form: Form) => {
  await form.typeName('  Anna Nowak ');
  await form.typeEmail(' Anna@Example.COM ');
  await form.typePassword('Secret123');
  await form.typeConfirm('Secret123');
  await form.acceptTerms();
};

const createButton = () => screen.getByRole('button', { name: /^Creat(e|ing)/ });

describe('SignUp screen', () => {
  it('shows every field, the terms, and a way back to log in', async () => {
    await renderSignUp();

    expect(screen.getByRole('header', { name: 'Create your account' })).toBeVisible();
    for (const label of ['Name', 'Email', 'Password', 'Confirm password']) {
      expect(screen.getByLabelText(label)).toBeVisible();
    }
    expect(screen.getByRole('checkbox', { name: /I accept the Terms of Use/ })).not.toBeChecked();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Log in' })).toBeVisible();
  });

  it('moves from field to field with the keyboard\'s next key, and the form can be completed', async () => {
    service.signUp.mockResolvedValue(annaResult);
    const form = await renderSignUp();

    await form.user.type(screen.getByLabelText('Name'), 'Anna Nowak', { submitEditing: true });
    await form.user.type(screen.getByLabelText('Email'), 'anna@example.com', { submitEditing: true });
    await form.user.type(screen.getByLabelText('Password'), 'Secret123', { submitEditing: true });
    await form.typeConfirm('Secret123');
    await form.acceptTerms();
    await form.user.press(createButton());

    expect(service.signUp).toHaveBeenCalledWith({
      name: 'Anna Nowak',
      email: 'anna@example.com',
      password: 'Secret123',
    });
  });

  it('does not start out with errors', async () => {
    await renderSignUp();
    expect(screen.queryByText('Enter your name')).toBeNull();
    expect(screen.queryByText('Accept the terms to create an account')).toBeNull();
  });

  it('tells autofill and password managers that these are new details', async () => {
    await renderSignUp();

    expect(screen.getByLabelText('Name').props).toMatchObject({
      autoComplete: 'name',
      textContentType: 'name',
      autoCapitalize: 'words',
    });
    expect(screen.getByLabelText('Email').props).toMatchObject({
      autoComplete: 'email',
      textContentType: 'emailAddress',
    });
    for (const label of ['Password', 'Confirm password']) {
      expect(screen.getByLabelText(label).props).toMatchObject({
        autoComplete: 'new-password',
        textContentType: 'newPassword',
        secureTextEntry: true,
      });
    }
  });

  describe('password strength', () => {
    it('explains the rule before anything is typed', async () => {
      await renderSignUp();
      expect(screen.getByText('Use at least 8 characters, with letters and numbers.')).toBeVisible();
    });

    it.each([
      ['abc', 'Weak'],
      ['Abcdefg1', 'Fair'],
      ['Abcdefg1!', 'Strong'],
    ])('rates %p as %s while it is typed', async (password, strength) => {
      const { typePassword } = await renderSignUp();

      await typePassword(password);

      expect(screen.getByLabelText(`Password strength: ${strength}`)).toBeVisible();
    });
  });

  describe('the two password fields', () => {
    it('are shown or hidden separately', async () => {
      const { user } = await renderSignUp();
      const [showPassword] = screen.getAllByRole('button', { name: 'Show password' });

      await user.press(showPassword);

      expect(screen.getByLabelText('Password').props.secureTextEntry).toBe(false);
      expect(screen.getByLabelText('Confirm password').props.secureTextEntry).toBe(true);
    });
  });

  describe('checking what was typed', () => {
    it('asks for everything on an empty form and does not call the service', async () => {
      const { user } = await renderSignUp();

      await user.press(createButton());

      expect(screen.getByText('Enter your name')).toBeVisible();
      expect(screen.getByText('Enter your email address')).toBeVisible();
      expect(screen.getByText('Use at least 8 characters')).toBeVisible();
      expect(screen.getByText('Accept the terms to create an account')).toBeVisible();
      expect(service.signUp).not.toHaveBeenCalled();
    });

    it('says when the password has no numbers', async () => {
      const form = await renderSignUp();
      await form.typePassword('abcdefghij');

      await form.user.press(createButton());

      expect(screen.getByText('Use both letters and numbers')).toBeVisible();
    });

    it('says when the two passwords differ', async () => {
      const form = await renderSignUp();
      await form.typePassword('Secret123');
      await form.typeConfirm('Secret124');

      await form.user.press(createButton());

      expect(screen.getByText('The passwords do not match')).toBeVisible();
    });

    it('asks to accept the terms, and the error goes once they are accepted', async () => {
      const form = await renderSignUp();
      await form.user.press(createButton());
      expect(screen.getByText('Accept the terms to create an account')).toBeVisible();

      await form.acceptTerms();

      expect(screen.queryByText('Accept the terms to create an account')).toBeNull();
      expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('lets the terms be taken back', async () => {
      const form = await renderSignUp();
      await form.acceptTerms();
      await form.acceptTerms();
      expect(screen.getByRole('checkbox')).not.toBeChecked();
    });
  });

  describe('creating the account', () => {
    it('sends the name and the email cleaned up, and the password as typed', async () => {
      service.signUp.mockResolvedValue(annaResult);
      const form = await renderSignUp();
      await fillValidForm(form);

      await form.user.press(createButton());

      expect(service.signUp).toHaveBeenCalledTimes(1);
      expect(service.signUp).toHaveBeenCalledWith({
        name: 'Anna Nowak',
        email: 'anna@example.com',
        password: 'Secret123',
      });
    });

    it('does not send the confirmation or the consent along with the details', async () => {
      service.signUp.mockResolvedValue(annaResult);
      const form = await renderSignUp();
      await fillValidForm(form);

      await form.user.press(createButton());

      expect(Object.keys(service.signUp.mock.calls[0][0]).sort()).toEqual(['email', 'name', 'password']);
    });

    it('signs the new user in, which is what moves them into the app', async () => {
      service.signUp.mockResolvedValue(annaResult);
      const form = await renderSignUp();
      await fillValidForm(form);

      await form.user.press(createButton());

      expect(useSessionStore.getState()).toMatchObject({ status: 'signedIn', user: annaResult.user });
    });

    it('shows a spinner, locks the fields and ignores more taps while it waits', async () => {
      const request = deferred<typeof annaResult>();
      service.signUp.mockReturnValue(request.promise);
      const form = await renderSignUp();
      await fillValidForm(form);

      await form.user.press(createButton());

      const button = screen.getByRole('button', { name: 'Creating your account…' });
      expect(button).toBeBusy();
      expect(button).toBeDisabled();
      expect(screen.getByLabelText('Name').props.editable).toBe(false);
      expect(screen.getByLabelText('Confirm password').props.editable).toBe(false);

      await form.user.press(button);
      expect(service.signUp).toHaveBeenCalledTimes(1);

      await act(async () => request.resolve(annaResult));
    });

    describe('when it fails', () => {
      const failWith = async (error: AuthError) => {
        service.signUp.mockRejectedValue(error);
        const form = await renderSignUp();
        await fillValidForm(form);
        await form.user.press(createButton());
        return form;
      };

      it('says when the email already has an account', async () => {
        await failWith(new AuthError('emailTaken'));

        expect(await screen.findByRole('alert')).toHaveTextContent(
          'An account with this email already exists',
        );
        expect(useSessionStore.getState().status).toBe('signedOut');
      });

      it('says when the server could not be reached, and keeps what was typed', async () => {
        await failWith(new AuthError('network'));

        expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach the server/);
        expect(screen.getByLabelText('Name')).toHaveDisplayValue('  Anna Nowak ');
        expect(screen.getByLabelText('Email')).toHaveDisplayValue(' Anna@Example.COM ');
        expect(screen.getByLabelText('Password')).toHaveDisplayValue('Secret123');
        expect(screen.getByLabelText('Confirm password')).toHaveDisplayValue('Secret123');
        expect(screen.getByRole('checkbox')).toBeChecked();
      });

      it('takes the message away when the user changes the email', async () => {
        const form = await failWith(new AuthError('emailTaken'));
        await screen.findByRole('alert');

        await form.typeEmail('x');

        expect(screen.queryByRole('alert')).toBeNull();
      });
    });
  });

  describe('navigation', () => {
    it('swaps this screen for log in', async () => {
      const { user } = await renderSignUp();

      await user.press(screen.getByRole('link', { name: 'Log in' }));

      expect(router.replace).toHaveBeenCalledWith('/login');
    });

    it('goes back', async () => {
      const { user } = await renderSignUp();

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.back).toHaveBeenCalledTimes(1);
    });
  });

  it('is in Polish when the app is', async () => {
    const { user } = await (async () => {
      const userInstance = userEvent.setup();
      await renderWithProviders(<SignUp />, { language: 'pl' });
      return { user: userInstance };
    })();

    expect(screen.getByRole('header', { name: 'Załóż konto' })).toBeVisible();
    expect(screen.getByRole('checkbox', { name: /Akceptuję Regulamin/ })).toBeVisible();
    await user.press(screen.getByRole('button', { name: 'Załóż konto' }));
    expect(screen.getByText('Podaj swoje imię')).toBeVisible();
    expect(screen.getByText('Zaakceptuj regulamin, aby założyć konto')).toBeVisible();
  });
});
