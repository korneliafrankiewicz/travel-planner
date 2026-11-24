import { screen, userEvent } from '@testing-library/react-native';
import * as Linking from 'expo-linking';

import { resetRouter, router, setParams } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Stop } from '../TripList/schema/stopSchema';
import type { Trip } from '../TripList/schema/tripSchema';
import { useStopsStore } from '../TripList/store/stopsStore';
import { useTripsStore } from '../TripList/store/tripsStore';
import TripDetails from './TripDetails';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);
jest.mock('expo-linking', () => ({ openURL: jest.fn(() => Promise.resolve(true)) }));

const lisbon: Trip = {
  id: 'lisbon',
  title: 'Lisbon city break',
  destination: 'Lisbon, Portugal',
  notes: 'Book the tram tickets',
  startDate: '2026-12-13',
  endDate: '2026-12-15',
};

const stop = (id: string, tripId: string, title = id): Stop => ({
  id,
  tripId,
  date: '2026-12-13',
  type: 'meal',
  title,
  startTime: '19:00',
  durationMin: 60,
  notes: '',
  url: '',
  coordinates: null,
});

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  jest.mocked(Linking.openURL).mockClear();
  setParams({ id: 'lisbon' });
  useTripsStore.setState({ trips: [lisbon] });
  useStopsStore.setState({ stops: [stop('s1', 'lisbon', 'Dinner'), stop('s2', 'lisbon', 'Fado show')] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('TripDetails screen', () => {
  describe('summary', () => {
    it('shows the title, destination, dates, length and number of stops', async () => {
      await renderWithProviders(<TripDetails />);

      expect(screen.getByRole('header', { name: 'Lisbon city break' })).toBeVisible();
      // The destination is shown in the summary and again in the map card.
      expect(screen.getAllByText('Lisbon, Portugal')).toHaveLength(2);
      expect(screen.getByText('Dec 13 – 15, 2026', { exact: false })).toBeVisible();
      expect(screen.getByText('3 days')).toBeVisible();
      expect(screen.getByText('2 stops')).toBeVisible();
    });

    it('shows the notes when there are some', async () => {
      await renderWithProviders(<TripDetails />);
      expect(screen.getByText('Book the tram tickets')).toBeVisible();
    });

    it('leaves out the notes section and the destination line when they are empty', async () => {
      useTripsStore.setState({ trips: [{ ...lisbon, notes: '', destination: '' }] });
      await renderWithProviders(<TripDetails />);

      expect(screen.queryByText('Book the tram tickets')).toBeNull();
      expect(screen.queryByRole('header', { name: 'Notes' })).toBeNull();
    });

    it('shows the itinerary with the trip’s stops', async () => {
      await renderWithProviders(<TripDetails />);
      expect(screen.getByRole('header', { name: 'Itinerary' })).toBeVisible();
      expect(screen.getByRole('button', { name: /Dinner/ })).toBeVisible();
      expect(screen.getByRole('button', { name: /Fado show/ })).toBeVisible();
    });

    it('is shown in Polish', async () => {
      await renderWithProviders(<TripDetails />, { language: 'pl' });
      expect(screen.getByRole('header', { name: 'Plan podróży' })).toBeVisible();
      expect(screen.getByText('3 dni')).toBeVisible();
      expect(screen.getByText('2 punkty')).toBeVisible();
    });
  });

  describe('navigation', () => {
    it('goes back', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it('goes to the home screen when there is nothing to go back to', async () => {
      router.canGoBack.mockReturnValue(false);
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Back' }));

      expect(router.replace).toHaveBeenCalledWith('/');
    });

    it('opens the editor for this trip', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Edit trip' }));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/trip/[id]/edit',
        params: { id: 'lisbon' },
      });
    });

    it('sends you home when the trip does not exist (e.g. an old link)', async () => {
      setParams({ id: 'nope' });
      await renderWithProviders(<TripDetails />);
      expect(screen.getByTestId('redirect')).toHaveTextContent('"/"');
    });
  });

  describe('deleting the trip', () => {
    it('asks for confirmation first and does not delete yet', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Delete trip' }));

      expect(screen.getByRole('header', { name: 'Delete this trip?' })).toBeVisible();
      expect(screen.getByText(/"Lisbon city break" and all its details/)).toBeVisible();
      expect(useTripsStore.getState().trips).toHaveLength(1);
    });

    it('keeps the trip when you cancel', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Delete trip' }));
      await user.press(screen.getByRole('button', { name: 'Cancel' }));

      expect(useTripsStore.getState().trips).toHaveLength(1);
      expect(useStopsStore.getState().stops).toHaveLength(2);
      expect(screen.queryByText('Delete this trip?')).toBeNull();
      expect(router.back).not.toHaveBeenCalled();
    });

    it('deletes the trip and its stops and goes back when you confirm', async () => {
      useStopsStore.setState({
        stops: [stop('s1', 'lisbon'), stop('s2', 'lisbon'), stop('other', 'another-trip')],
      });
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Delete trip' }));
      await user.press(screen.getByRole('button', { name: 'Delete' }));

      expect(useTripsStore.getState().trips).toEqual([]);
      expect(useStopsStore.getState().stops.map((item) => item.id)).toEqual(['other']);
      expect(router.back).toHaveBeenCalledTimes(1);
    });

    it('keeps showing the trip while the screen closes instead of redirecting mid-animation', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Delete trip' }));
      await user.press(screen.getByRole('button', { name: 'Delete' }));

      expect(screen.queryByTestId('redirect')).toBeNull();
      expect(screen.getByRole('header', { name: 'Lisbon city break' })).toBeVisible();
    });
  });

  describe('map', () => {
    const withPlace = (item: Stop, latitude: number, longitude: number): Stop => ({
      ...item,
      coordinates: { latitude, longitude },
    });

    it('shows a pin for each stop that has a place, and none for the others', async () => {
      useStopsStore.setState({
        stops: [
          withPlace(stop('s1', 'lisbon', 'Dinner'), 38.7071, -9.1457),
          stop('s2', 'lisbon', 'Fado show'),
          withPlace(stop('other', 'another-trip', 'Elsewhere'), 50, 20),
        ],
      });
      await renderWithProviders(<TripDetails />);

      expect(screen.getByTestId('map-view')).toBeVisible();
      expect(screen.getByRole('button', { name: 'pin: Dinner, Day 1 · 19:00' })).toBeVisible();
      expect(screen.queryByRole('button', { name: /pin: Fado show/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /pin: Elsewhere/ })).toBeNull();
    });

    it('still offers the Google Maps link below the map', async () => {
      useStopsStore.setState({ stops: [withPlace(stop('s1', 'lisbon', 'Dinner'), 38.7, -9.1)] });
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Open in Google Maps' }));

      expect(Linking.openURL).toHaveBeenCalledTimes(1);
    });

    it('opens the stop when its pin label is tapped', async () => {
      useStopsStore.setState({ stops: [withPlace(stop('s1', 'lisbon', 'Dinner'), 38.7, -9.1)] });
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: /pin: Dinner/ }));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/trip/[id]/stops/[stopId]',
        params: { id: 'lisbon', stopId: 's1' },
      });
    });

    it('labels the pins in Polish', async () => {
      useStopsStore.setState({ stops: [withPlace(stop('s1', 'lisbon', 'Dinner'), 38.7, -9.1)] });
      await renderWithProviders(<TripDetails />, { language: 'pl' });

      expect(screen.getByRole('button', { name: 'pin: Dinner, Dzień 1 · 19:00' })).toBeVisible();
    });
  });

  describe('Google Maps', () => {
    it('shows the destination in the map fallback card when no stop has a place', async () => {
      await renderWithProviders(<TripDetails />);
      expect(screen.getByRole('header', { name: 'Map' })).toBeVisible();
      expect(screen.getByText('Add coordinates to a stop to see it on the map')).toBeVisible();
      expect(screen.queryByTestId('map-view')).toBeNull();
    });

    it('opens a Google Maps search for the destination', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Open in Google Maps' }));

      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=Lisbon%2C%20Portugal',
      );
    });

    it('searches for the trip title when there is no destination', async () => {
      useTripsStore.setState({ trips: [{ ...lisbon, destination: '' }] });
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      expect(screen.getByText('No destination set')).toBeVisible();
      await user.press(screen.getByRole('button', { name: 'Open in Google Maps' }));

      expect(Linking.openURL).toHaveBeenCalledWith(
        'https://www.google.com/maps/search/?api=1&query=Lisbon%20city%20break',
      );
    });

    it('does not crash when the link cannot be opened', async () => {
      jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error('no app'));
      const user = userEvent.setup();
      await renderWithProviders(<TripDetails />);

      await user.press(screen.getByRole('button', { name: 'Open in Google Maps' }));

      expect(screen.getByRole('header', { name: 'Lisbon city break' })).toBeVisible();
    });
  });
});
