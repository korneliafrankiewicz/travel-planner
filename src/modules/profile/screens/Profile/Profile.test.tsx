import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';
import { useSessionStore } from '@/shared/auth/sessionStore';

import { useTripsStore } from '../../../trips/screens/TripList/store/tripsStore';
import Profile from './Profile';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

const trip = (id: string, startDate: string, endDate: string) => ({
  id,
  title: id,
  destination: '',
  notes: '',
  startDate,
  endDate,
});

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  useSessionStore.setState({
    status: 'signedIn',
    user: { id: 'u1', name: 'Anna Nowak', email: 'anna.nowak@example.com' },
  });
  useTripsStore.setState({
    trips: [
      trip('past', '2026-10-01', '2026-10-05'),
      trip('soon', '2026-12-13', '2026-12-15'),
      trip('later', '2027-02-01', '2027-02-03'),
    ],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('Profile screen', () => {
  it('shows who is logged in', async () => {
    await renderWithProviders(<Profile />);

    expect(screen.getByRole('header', { name: 'Anna Nowak' })).toBeVisible();
    expect(screen.getByText('anna.nowak@example.com')).toBeVisible();
    expect(screen.getByText('AN')).toBeVisible();
  });

  it('shows how many trips there are, upcoming and past', async () => {
    await renderWithProviders(<Profile />);

    expect(screen.getByRole('header', { name: 'Your travel' })).toBeVisible();
    expect(screen.getByLabelText('Trips: 3')).toBeVisible();
    expect(screen.getByLabelText('Upcoming: 2')).toBeVisible();
    expect(screen.getByLabelText('Past: 1')).toBeVisible();
  });

  it('shows zeros when there are no trips', async () => {
    useTripsStore.setState({ trips: [] });
    await renderWithProviders(<Profile />);

    expect(screen.getByLabelText('Trips: 0')).toBeVisible();
    expect(screen.getByLabelText('Upcoming: 0')).toBeVisible();
    expect(screen.getByLabelText('Past: 0')).toBeVisible();
  });

  it('is shown in Polish', async () => {
    await renderWithProviders(<Profile />, { language: 'pl' });

    expect(screen.getByRole('header', { name: 'Twoje podróże' })).toBeVisible();
    expect(screen.getByLabelText('Nadchodzące: 2')).toBeVisible();
  });

  describe('back button', () => {
    it('goes back when there is a screen to go back to', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<Profile />);

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.back).toHaveBeenCalledTimes(1);
      expect(router.replace).not.toHaveBeenCalled();
    });

    it('goes to the trip list when the screen was opened directly', async () => {
      router.canGoBack.mockReturnValue(false);
      const user = userEvent.setup();
      await renderWithProviders(<Profile />);

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.replace).toHaveBeenCalledWith('/');
      expect(router.back).not.toHaveBeenCalled();
    });
  });
});
