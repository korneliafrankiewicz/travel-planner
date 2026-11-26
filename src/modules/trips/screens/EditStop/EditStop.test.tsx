import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router, setParams } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Stop } from '../TripList/schema/stopSchema';
import { useStopsStore } from '../TripList/store/stopsStore';
import { useTripsStore, type Trip } from '../TripList/store/tripsStore';
import EditStop from './EditStop';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

const lisbon: Trip = {
  id: 'lisbon',
  title: 'Lisbon city break',
  destination: 'Lisbon, Portugal',
  notes: '',
  startDate: '2026-12-13',
  endDate: '2026-12-15',
};

const dinner: Stop = {
  id: 's1',
  tripId: 'lisbon',
  date: '2026-12-13',
  type: 'meal',
  title: 'Dinner',
  startTime: '19:00',
  durationMin: 90,
  notes: 'Book a table',
  url: '',
  coordinates: { latitude: 38.7071, longitude: -9.1457 },
};

beforeEach(() => {
  // "Today" is 20 November 2026, before the trip.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  setParams({ id: 'lisbon', stopId: 's1' });
  useTripsStore.setState({ trips: [lisbon] });
  useStopsStore.setState({ stops: [dinner] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('EditStop screen', () => {
  it('shows the stop in the form', async () => {
    await renderWithProviders(<EditStop />);

    expect(screen.getByRole('header', { name: 'Edit stop' })).toBeVisible();
    expect(screen.getByDisplayValue('Dinner')).toBeVisible();
    expect(screen.getByDisplayValue('19:00')).toBeVisible();
    expect(screen.getByDisplayValue('90')).toBeVisible();
    expect(screen.getByDisplayValue('Book a table')).toBeVisible();
    expect(screen.getByDisplayValue('38.7071')).toBeVisible();
    expect(screen.getByDisplayValue('-9.1457')).toBeVisible();
  });

  it('shows empty coordinates for a stop without a place', async () => {
    useStopsStore.setState({ stops: [{ ...dinner, coordinates: null }] });
    await renderWithProviders(<EditStop />);

    expect(screen.queryByDisplayValue('38.7071')).toBeNull();
    expect(screen.getByRole('button', { name: 'Choose on map' })).toBeVisible();
  });

  it('saves the changes to the same stop, then goes back', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<EditStop />);

    const title = screen.getByDisplayValue('Dinner');
    await user.clear(title);
    await user.type(title, 'Fado dinner');
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(useStopsStore.getState().stops).toEqual([
      { ...dinner, title: 'Fado dinner' },
    ]);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('keeps a stop on a day that is already in the past', async () => {
    jest.setSystemTime(new Date(2026, 11, 14, 12, 0));
    const user = userEvent.setup();
    await renderWithProviders(<EditStop />);

    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(useStopsStore.getState().stops).toEqual([dinner]);
  });

  describe('deleting', () => {
    it('asks for confirmation first', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<EditStop />);

      await user.press(screen.getByRole('button', { name: 'Delete stop' }));

      expect(screen.getByText('Delete this stop?')).toBeVisible();
      expect(screen.getByText('"Dinner" will be removed from the itinerary.')).toBeVisible();
      expect(useStopsStore.getState().stops).toHaveLength(1);
    });

    it('keeps the stop when cancelled', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<EditStop />);

      await user.press(screen.getByRole('button', { name: 'Delete stop' }));
      // The form has a Cancel button too; the dialog's is the last one.
      await user.press(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!);

      expect(screen.queryByText('Delete this stop?')).toBeNull();
      expect(useStopsStore.getState().stops).toHaveLength(1);
      expect(router.back).not.toHaveBeenCalled();
    });

    it('removes the stop and goes back when confirmed, without redirecting', async () => {
      const user = userEvent.setup();
      await renderWithProviders(<EditStop />);

      await user.press(screen.getByRole('button', { name: 'Delete stop' }));
      await user.press(screen.getByRole('button', { name: 'Delete' }));

      expect(useStopsStore.getState().stops).toHaveLength(0);
      expect(router.back).toHaveBeenCalledTimes(1);
      // The form stays on screen while the screen closes.
      expect(screen.queryByTestId('redirect')).toBeNull();
      expect(screen.getByRole('header', { name: 'Edit stop' })).toBeVisible();
    });
  });

  it('sends the user to the trip when the stop does not exist', async () => {
    setParams({ id: 'lisbon', stopId: 'unknown' });
    await renderWithProviders(<EditStop />);

    expect(screen.getByTestId('redirect')).toHaveTextContent(
      JSON.stringify({ pathname: '/trip/[id]', params: { id: 'lisbon' } }),
    );
  });

  it('sends the user to the trip list when the trip does not exist', async () => {
    setParams({ id: 'unknown', stopId: 's1' });
    await renderWithProviders(<EditStop />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('"/"');
  });
});
