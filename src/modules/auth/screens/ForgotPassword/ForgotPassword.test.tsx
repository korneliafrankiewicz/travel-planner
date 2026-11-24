import { act, screen, userEvent } from '@testing-library/react-native';

import { AuthError } from '@/shared/auth/types';
import { deferred, mockedAuthService as service, resetAuth } from '@/test-utils/authTestUtils';
import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import ForgotPassword from './ForgotPassword';

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

const renderForgotPassword = async (language: 'en' | 'pl' = 'en') => {
  const user = userEvent.setup();
  await renderWithProviders(<ForgotPassword />, { language });
  const label = language === 'en' ? 'Email' : 'E-mail';
  return { user, typeEmail: (text: string) => user.type(screen.getByLabelText(label), text) };
};

const sendButton = () => screen.getByRole('button', { name: /^Send(ing)?/ });

describe('ForgotPassword screen', () => {
  it('asks for the email and explains what will happen', async () => {
    await renderForgotPassword();

    expect(screen.getByRole('header', { name: 'Reset your password' })).toBeVisible();
    expect(screen.getByText(/we'll send you a link to reset it/)).toBeVisible();
    expect(screen.getByLabelText('Email')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeVisible();
  });

  describe('checking what was typed', () => {
    it('asks for the email and does not call the service', async () => {
      const { user } = await renderForgotPassword();

      await user.press(sendButton());

      expect(screen.getByText('Enter your email address')).toBeVisible();
      expect(service.requestPasswordReset).not.toHaveBeenCalled();
    });

    it('says when the email is not valid', async () => {
      const { user, typeEmail } = await renderForgotPassword();
      await typeEmail('anna@');

      await user.press(sendButton());

      expect(screen.getByText('Enter a valid email address')).toBeVisible();
      expect(service.requestPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('asking for the link', () => {
    it('sends the email, cleaned up', async () => {
      service.requestPasswordReset.mockResolvedValue();
      const { user, typeEmail } = await renderForgotPassword();
      await typeEmail('  Anna@Example.COM ');

      await user.press(sendButton());

      expect(service.requestPasswordReset).toHaveBeenCalledTimes(1);
      expect(service.requestPasswordReset).toHaveBeenCalledWith('anna@example.com');
    });

    it('can be done with the keyboard', async () => {
      service.requestPasswordReset.mockResolvedValue();
      const { user } = await renderForgotPassword();

      await user.type(screen.getByLabelText('Email'), 'anna@example.com', { submitEditing: true });

      expect(service.requestPasswordReset).toHaveBeenCalledTimes(1);
    });

    it('shows a spinner, locks the field and ignores more taps while it waits', async () => {
      const request = deferred();
      service.requestPasswordReset.mockReturnValue(request.promise);
      const { user, typeEmail } = await renderForgotPassword();
      await typeEmail('anna@example.com');

      await user.press(sendButton());

      const button = screen.getByRole('button', { name: 'Sending…' });
      expect(button).toBeBusy();
      expect(button).toBeDisabled();
      expect(screen.getByLabelText('Email').props.editable).toBe(false);
      await user.press(button);
      expect(service.requestPasswordReset).toHaveBeenCalledTimes(1);

      await act(async () => request.resolve());
    });

    it('then says to check the email, naming the address that was used', async () => {
      service.requestPasswordReset.mockResolvedValue();
      const { user, typeEmail } = await renderForgotPassword();
      await typeEmail('Anna@Example.com');

      await user.press(sendButton());

      expect(await screen.findByRole('header', { name: 'Check your email' })).toBeVisible();
      expect(
        screen.getByText(
          'If an account exists for anna@example.com, we have sent a link to reset the password.',
        ),
      ).toBeVisible();
      expect(screen.queryByLabelText('Email')).toBeNull();
    });

    it('does not reveal whether the address has an account: the answer is worded as an "if"', async () => {
      service.requestPasswordReset.mockResolvedValue();
      const { user, typeEmail } = await renderForgotPassword();
      await typeEmail('nobody@example.com');

      await user.press(sendButton());

      expect(await screen.findByText(/^If an account exists for/)).toBeVisible();
    });

    it('goes back to log in from the confirmation, replacing this screen', async () => {
      service.requestPasswordReset.mockResolvedValue();
      const { user, typeEmail } = await renderForgotPassword();
      await typeEmail('anna@example.com');
      await user.press(sendButton());

      await user.press(await screen.findByRole('button', { name: 'Back to log in' }));

      expect(router.replace).toHaveBeenCalledWith('/login');
    });

    describe('when it fails', () => {
      it('says so and stays on the form, so the user can try again', async () => {
        service.requestPasswordReset.mockRejectedValue(new AuthError('network'));
        const { user, typeEmail } = await renderForgotPassword();
        await typeEmail('anna@example.com');

        await user.press(sendButton());

        expect(await screen.findByRole('alert')).toHaveTextContent(/Could not reach the server/);
        expect(screen.queryByText('Check your email')).toBeNull();
        expect(screen.getByLabelText('Email')).toHaveDisplayValue('anna@example.com');

        service.requestPasswordReset.mockResolvedValue();
        await user.press(sendButton());
        expect(await screen.findByText('Check your email')).toBeVisible();
      });
    });
  });

  it('goes back', async () => {
    const { user } = await renderForgotPassword();

    await user.press(screen.getByRole('button', { name: 'Back' }));

    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('is in Polish when the app is', async () => {
    service.requestPasswordReset.mockResolvedValue();
    const { user, typeEmail } = await renderForgotPassword('pl');

    expect(screen.getByRole('header', { name: 'Zresetuj hasło' })).toBeVisible();
    await typeEmail('anna@example.com');
    await user.press(screen.getByRole('button', { name: 'Wyślij link' }));

    expect(await screen.findByRole('header', { name: 'Sprawdź skrzynkę' })).toBeVisible();
    expect(screen.getByText(/Jeśli istnieje konto dla adresu anna@example.com/)).toBeVisible();
  });
});
