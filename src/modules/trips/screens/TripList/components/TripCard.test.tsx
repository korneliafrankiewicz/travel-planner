import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Trip } from '../schema/tripSchema';
import type { Stop } from '../schema/stopSchema';
import { useStopsStore } from '../store/stopsStore';
import { TripCard } from './TripCard';

const TODAY = new Date(2026, 10, 20, 15, 30);

const makeTrip = (startDate: string, endDate: string, id = 'trip-1'): Trip => ({
  id,
  title: 'Lisbon city break',
  destination: 'Lisbon',
  notes: '',
  startDate,
  endDate,
});

const makeStops = (tripId: string, count: number): Stop[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${tripId}-stop-${index}`,
    tripId,
    date: '2026-12-13',
    type: 'attraction',
    title: `Stop ${index}`,
    startTime: '09:00',
    durationMin: 30,
    notes: '',
    url: '',
  }));

const renderCard = (trip: Trip, options?: { language?: 'en' | 'pl'; onPress?: () => void }) =>
  renderWithProviders(<TripCard trip={trip} today={TODAY} onPress={options?.onPress ?? jest.fn()} />, {
    language: options?.language,
  });

// Newer ICU versions put thin spaces around the dash in date ranges.
const normalizeSpaces = (text: string) => text.replace(/[   ]/g, ' ');

beforeEach(() => {
  useStopsStore.setState({ stops: makeStops('trip-1', 5) });
});

describe('TripCard', () => {
  it('shows the title, the dates and the day and stop counts', async () => {
    await renderCard(makeTrip('2026-12-13', '2026-12-15'));

    expect(screen.getByText('Lisbon city break')).toBeVisible();
    expect(screen.getByText('Dec 13 – 15, 2026', { exact: false })).toBeVisible();
    expect(screen.getByText('3 days · 5 stops')).toBeVisible();
  });

  it('formats the dates in the app language', async () => {
    await renderCard(makeTrip('2026-12-13', '2026-12-15'), { language: 'pl' });
    expect(screen.getByText('13–15 gru 2026')).toBeVisible();
  });

  describe('days-until badge', () => {
    it('counts the days until an upcoming trip', async () => {
      await renderCard(makeTrip('2026-12-13', '2026-12-15'));
      expect(screen.getByText('In 23 days')).toBeVisible();
    });

    it('uses the singular for one day', async () => {
      await renderCard(makeTrip('2026-11-21', '2026-11-22'));
      expect(screen.getByText('In 1 day')).toBeVisible();
    });

    it('says "Today" on the first day of the trip', async () => {
      await renderCard(makeTrip('2026-11-20', '2026-11-22'));
      expect(screen.getByText('Today')).toBeVisible();
    });

    it('says "Ongoing" while the trip is under way', async () => {
      await renderCard(makeTrip('2026-11-18', '2026-11-22'));
      expect(screen.getByText('Ongoing')).toBeVisible();
    });

    it('shows no badge for a trip that is over', async () => {
      await renderCard(makeTrip('2026-11-10', '2026-11-12'));
      expect(screen.queryByText(/^In \d+|^Today$|^Ongoing$/)).toBeNull();
    });

    it.each([
      [1, 'Za 1 dzień'],
      [2, 'Za 2 dni'],
      [5, 'Za 5 dni'],
      [22, 'Za 22 dni'],
      [23, 'Za 23 dni'],
    ])('uses the right Polish form for %i days', async (days, expected) => {
      // The trip starts `days` days after TODAY (20 Nov 2026).
      const start = new Date(2026, 10, 20 + days);
      const iso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`;
      await renderCard(makeTrip(iso, iso), { language: 'pl' });
      expect(screen.getByText(expected)).toBeVisible();
    });
  });

  describe('counts', () => {
    it.each([
      [0, '3 days · 0 stops'],
      [1, '3 days · 1 stop'],
      [2, '3 days · 2 stops'],
    ])('uses the right English form for %i stops', async (count, expected) => {
      useStopsStore.setState({ stops: makeStops('trip-1', count) });
      await renderCard(makeTrip('2026-12-13', '2026-12-15'));
      expect(screen.getByText(expected)).toBeVisible();
    });

    it.each([
      [0, '3 dni · 0 punktów'],
      [1, '3 dni · 1 punkt'],
      [2, '3 dni · 2 punkty'],
      [5, '3 dni · 5 punktów'],
      [22, '3 dni · 22 punkty'],
    ])('uses the right Polish form for %i stops', async (count, expected) => {
      useStopsStore.setState({ stops: makeStops('trip-1', count) });
      await renderCard(makeTrip('2026-12-13', '2026-12-15'), { language: 'pl' });
      expect(screen.getByText(expected)).toBeVisible();
    });

    it('counts only the stops of this trip', async () => {
      useStopsStore.setState({ stops: [...makeStops('trip-1', 2), ...makeStops('other', 7)] });
      await renderCard(makeTrip('2026-12-13', '2026-12-15'));
      expect(screen.getByText('3 days · 2 stops')).toBeVisible();
    });

    it('counts a one-day trip as 1 day', async () => {
      await renderCard(makeTrip('2026-12-13', '2026-12-13'));
      expect(normalizeSpaces(screen.getByText(/^1 day · /).props.children)).toBe('1 day · 5 stops');
    });
  });

  it('is a button named after the trip and calls onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderCard(makeTrip('2026-12-13', '2026-12-15'), { onPress });

    await user.press(screen.getByRole('button', { name: 'Lisbon city break' }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
