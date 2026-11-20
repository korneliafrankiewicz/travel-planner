import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Trip } from './schema/tripSchema';
import { useStopsStore } from './store/stopsStore';
import { useTripsStore } from './store/tripsStore';
import TripList from './TripList';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

const makeTrip = (id: string, title: string, startDate: string, endDate: string): Trip => ({
  id,
  title,
  destination: '',
  notes: '',
  startDate,
  endDate,
});

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  useStopsStore.setState({ stops: [] });
  useTripsStore.setState({
    trips: [
      makeTrip('soon', 'Lisbon city break', '2026-12-13', '2026-12-15'),
      makeTrip('later', 'Ski week', '2027-02-01', '2027-02-07'),
      makeTrip('old', 'Tatra Mountains', '2026-08-14', '2026-08-17'),
    ],
  });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TripList screen', () => {
  it('shows the title and the upcoming trips, soonest first', async () => {
    await renderWithProviders(<TripList />);

    expect(screen.getByRole('header', { name: 'Your trips' })).toBeVisible();
    const cards = screen.getAllByRole('button', { name: /Lisbon city break|Ski week|Tatra/ });
    expect(cards.map((card) => card.props.accessibilityLabel)).toEqual([
      'Lisbon city break',
      'Ski week',
    ]);
  });

  it('shows the screen in Polish', async () => {
    await renderWithProviders(<TripList />, { language: 'pl' });
    expect(screen.getByRole('header', { name: 'Twoje podróże' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Nadchodzące' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Nowa podróż' })).toBeVisible();
  });

  describe('Upcoming and Past tabs', () => {
    it('starts on Upcoming', async () => {
      await renderWithProviders(<TripList />);
      expect(screen.getByRole('radio', { name: 'Upcoming' })).toBeSelected();
    });

    it('switches to the past trips and back', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripList />);

      await user.press(screen.getByRole('radio', { name: 'Past' }));
      expect(screen.getByRole('button', { name: 'Tatra Mountains' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Lisbon city break' })).toBeNull();

      await user.press(screen.getByRole('radio', { name: 'Upcoming' }));
      expect(screen.getByRole('button', { name: 'Lisbon city break' })).toBeVisible();
      expect(screen.queryByRole('button', { name: 'Tatra Mountains' })).toBeNull();
    });
  });

  describe('navigation', () => {
    it('opens a trip when its card is pressed', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripList />);

      await user.press(screen.getByRole('button', { name: 'Ski week' }));

      expect(router.push).toHaveBeenCalledWith({ pathname: '/trip/[id]', params: { id: 'later' } });
    });

    it('opens the New trip screen from the button below the list', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripList />);

      await user.press(screen.getByRole('button', { name: 'New trip' }));

      expect(router.push).toHaveBeenCalledWith('/new-trip');
    });

    it('opens the profile from the avatar in the header', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripList />);

      await user.press(screen.getByRole('button', { name: 'Profile' }));

      expect(router.push).toHaveBeenCalledWith('/profile');
    });
  });

  describe('empty states', () => {
    beforeEach(() => {
      useTripsStore.setState({ trips: [] });
    });

    it('invites you to create the first trip, with a single New trip button', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripList />);

      expect(screen.getByText('You have no trips yet')).toBeVisible();
      // The empty state carries the button; the one below the list is hidden.
      expect(screen.getAllByRole('button', { name: 'New trip' })).toHaveLength(1);

      await user.press(screen.getByRole('button', { name: 'New trip' }));
      expect(router.push).toHaveBeenCalledWith('/new-trip');
    });

    it('says there are no past trips, without a button', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripList />);

      await user.press(screen.getByRole('radio', { name: 'Past' }));

      expect(screen.getByText('You have no past trips')).toBeVisible();
      expect(screen.queryByRole('button', { name: 'New trip' })).toBeNull();
    });

    it('shows the empty message for Upcoming when only past trips exist', async () => {
      useTripsStore.setState({ trips: [makeTrip('old', 'Tatra Mountains', '2026-08-14', '2026-08-17')] });
      await renderWithProviders(<TripList />);
      expect(screen.getByText('You have no trips yet')).toBeVisible();
    });
  });
});
