import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import Welcome from './Welcome';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

beforeEach(() => {
  resetRouter();
});

describe('Welcome screen', () => {
  it('says what the app is for', async () => {
    await renderWithProviders(<Welcome />);

    expect(screen.getByRole('header', { name: 'Plan trips, day by day' })).toBeVisible();
    expect(screen.getByText(/Maps, routes and places for every stop/)).toBeVisible();
  });

  it('offers to log in and to create an account, and nothing else yet', async () => {
    await renderWithProviders(<Welcome />);

    expect(screen.getByRole('button', { name: 'Log in' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Create account' })).toBeVisible();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('has no back button, as it is the first screen', async () => {
    await renderWithProviders(<Welcome />);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('goes to the log in screen', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Welcome />);

    await user.press(screen.getByRole('button', { name: 'Log in' }));

    expect(router.push).toHaveBeenCalledWith('/login');
  });

  it('goes to the sign up screen', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<Welcome />);

    await user.press(screen.getByRole('button', { name: 'Create account' }));

    expect(router.push).toHaveBeenCalledWith('/sign-up');
  });

  it('is in Polish when the app is', async () => {
    await renderWithProviders(<Welcome />, { language: 'pl' });

    expect(screen.getByRole('header', { name: 'Planuj podróże dzień po dniu' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Zaloguj się' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Załóż konto' })).toBeVisible();
  });
});
