import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Stop } from '../../TripList/schema/stopSchema';
import type { Trip } from '../../TripList/schema/tripSchema';
import { useStopsStore } from '../../TripList/store/stopsStore';
import { ItinerarySection } from './ItinerarySection';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

const trip: Trip = {
  id: 'trip-1',
  title: 'Lisbon',
  destination: '',
  notes: '',
  startDate: '2026-12-13',
  endDate: '2026-12-15',
};

const stop = (id: string, date: string, startTime: string, durationMin: number, title = id): Stop => ({
  id,
  tripId: 'trip-1',
  date,
  type: 'attraction',
  title,
  startTime,
  durationMin,
  notes: '',
  url: '',
});

const setToday = (year: number, month: number, day: number) =>
  jest.useFakeTimers({ now: new Date(year, month, day, 12, 0), advanceTimers: true });

beforeEach(() => {
  setToday(2026, 10, 20); // 20 November 2026, before the trip
  resetRouter();
  useStopsStore.setState({ stops: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('ItinerarySection', () => {
  describe('days', () => {
    it('lists every day of the trip with its number and date', async () => {
      await renderWithProviders(<ItinerarySection trip={trip} />);

      expect(screen.getByRole('header', { name: 'Itinerary' })).toBeVisible();
      for (const [number, date] of [
        [1, 'Sun, Dec 13'],
        [2, 'Mon, Dec 14'],
        [3, 'Tue, Dec 15'],
      ] as const) {
        expect(screen.getByRole('header', { name: `Day ${number}` })).toBeVisible();
        expect(screen.getByText(date)).toBeVisible();
      }
    });

    it('says when a day has no stops', async () => {
      await renderWithProviders(<ItinerarySection trip={trip} />);
      expect(screen.getAllByText('No stops planned yet')).toHaveLength(3);
    });

    it('is shown in Polish', async () => {
      await renderWithProviders(<ItinerarySection trip={trip} />, { language: 'pl' });
      expect(screen.getByRole('header', { name: 'Dzień 1' })).toBeVisible();
      expect(screen.getAllByText('Nie zaplanowano jeszcze żadnych punktów')).toHaveLength(3);
    });
  });

  describe('stops', () => {
    it('are listed under their own day, ordered by start time', async () => {
      useStopsStore.setState({
        stops: [
          stop('late', '2026-12-14', '20:00', 60, 'Dinner'),
          stop('early', '2026-12-14', '09:00', 60, 'Museum'),
          stop('other-day', '2026-12-15', '10:00', 60, 'Castle'),
        ],
      });
      await renderWithProviders(<ItinerarySection trip={trip} />);

      const names = screen
        .getAllByRole('button', { name: /Museum|Dinner|Castle/ })
        .map((button) => button.props.accessibilityLabel.split(',')[0]);
      expect(names).toEqual(['Museum', 'Dinner', 'Castle']);
      // Day 1 has no stops, days 2 and 3 do.
      expect(screen.getAllByText('No stops planned yet')).toHaveLength(1);
    });

    it('ignore stops of other trips', async () => {
      useStopsStore.setState({
        stops: [{ ...stop('x', '2026-12-14', '09:00', 60, 'Not mine'), tripId: 'other-trip' }],
      });
      await renderWithProviders(<ItinerarySection trip={trip} />);
      expect(screen.queryByText('Not mine')).toBeNull();
    });

    it('open the editor when pressed', async () => {
      useStopsStore.setState({ stops: [stop('s1', '2026-12-14', '09:00', 60, 'Museum')] });
      const user = userEvent.setup();
      await renderWithProviders(<ItinerarySection trip={trip} />);

      await user.press(screen.getByRole('button', { name: /Museum/ }));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/trip/[id]/stops/[stopId]',
        params: { id: 'trip-1', stopId: 's1' },
      });
    });

    it('show a warning on both stops that overlap, and on no other', async () => {
      useStopsStore.setState({
        stops: [
          stop('a', '2026-12-14', '09:00', 120, 'Museum'),
          stop('b', '2026-12-14', '10:00', 60, 'Lunch'),
          stop('c', '2026-12-14', '14:00', 60, 'Walk'),
        ],
      });
      await renderWithProviders(<ItinerarySection trip={trip} />);

      expect(screen.getAllByText('Overlaps with another stop')).toHaveLength(2);
      expect(screen.getByRole('button', { name: /Museum.*Overlaps with another stop/ })).toBeVisible();
      expect(screen.getByRole('button', { name: /Lunch.*Overlaps with another stop/ })).toBeVisible();
      expect(screen.getByRole('button', { name: /^Walk/ }).props.accessibilityLabel).not.toContain('Overlaps');
    });

    it('only compare stops of the same day', async () => {
      useStopsStore.setState({
        stops: [
          stop('a', '2026-12-14', '09:00', 120, 'Museum'),
          stop('b', '2026-12-15', '10:00', 60, 'Lunch'),
        ],
      });
      await renderWithProviders(<ItinerarySection trip={trip} />);
      expect(screen.queryByText('Overlaps with another stop')).toBeNull();
    });
  });

  describe('adding a stop', () => {
    it('has an Add stop button on every day while the trip is still ahead', async () => {
      await renderWithProviders(<ItinerarySection trip={trip} />);
      expect(screen.getAllByRole('button', { name: /^Add stop/ })).toHaveLength(3);
    });

    it('opens the new-stop screen on the day whose button was pressed', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<ItinerarySection trip={trip} />);

      await user.press(screen.getByRole('button', { name: 'Add stop, Mon, Dec 14' }));

      expect(router.push).toHaveBeenCalledWith({
        pathname: '/trip/[id]/stops/new',
        params: { id: 'trip-1', date: '2026-12-14' },
      });
    });

    it('has no Add stop button on days in the past (stops are planned in advance)', async () => {
      jest.useRealTimers();
      setToday(2026, 11, 14); // 14 December: day 1 is over, day 2 is today
      await renderWithProviders(<ItinerarySection trip={trip} />);

      expect(screen.queryByRole('button', { name: 'Add stop, Sun, Dec 13' })).toBeNull();
      expect(screen.getByRole('button', { name: 'Add stop, Mon, Dec 14' })).toBeVisible();
      expect(screen.getByRole('button', { name: 'Add stop, Tue, Dec 15' })).toBeVisible();
    });

    it('has no Add stop button at all for a trip that is over', async () => {
      jest.useRealTimers();
      setToday(2027, 0, 5);
      await renderWithProviders(<ItinerarySection trip={trip} />);
      expect(screen.queryByRole('button', { name: /^Add stop/ })).toBeNull();
    });

    it('still lets you open the stops of a past day', async () => {
      jest.useRealTimers();
      setToday(2027, 0, 5);
      useStopsStore.setState({ stops: [stop('s1', '2026-12-14', '09:00', 60, 'Museum')] });
      await renderWithProviders(<ItinerarySection trip={trip} />);
      expect(screen.getByRole('button', { name: /Museum/ })).toBeVisible();
    });
  });

  describe('days outside the trip dates', () => {
    beforeEach(() => {
      useStopsStore.setState({ stops: [stop('o', '2026-12-20', '10:00', 60, 'Leftover')] });
    });

    it('still show their stops, labelled as outside the trip', async () => {
      await renderWithProviders(<ItinerarySection trip={trip} />);

      expect(screen.getByRole('header', { name: 'Outside the trip dates' })).toBeVisible();
      expect(screen.getByRole('button', { name: /Leftover/ })).toBeVisible();
    });

    it('cannot get new stops', async () => {
      await renderWithProviders(<ItinerarySection trip={trip} />);
      // The three trip days have a button; the extra day does not.
      expect(screen.getAllByRole('button', { name: /^Add stop/ })).toHaveLength(3);
      expect(screen.queryByRole('button', { name: 'Add stop, Sun, Dec 20' })).toBeNull();
    });
  });
});
