import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router, setParams } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { useStopsStore } from '../TripList/store/stopsStore';
import { useTripsStore, type Trip } from '../TripList/store/tripsStore';
import NewStop from './NewStop';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

const lisbon: Trip = {
  id: 'lisbon',
  title: 'Lisbon city break',
  destination: 'Lisbon, Portugal',
  notes: '',
  startDate: '2026-12-13',
  endDate: '2026-12-15',
};

const TITLE_PLACEHOLDER = 'e.g. Dinner at Time Out Market';

beforeEach(() => {
  // "Today" is 20 November 2026, before the trip.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  setParams({ id: 'lisbon' });
  useTripsStore.setState({ trips: [lisbon] });
  useStopsStore.setState({ stops: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('NewStop screen', () => {
  it('shows an empty form with the default time and duration', async () => {
    await renderWithProviders(<NewStop />);

    expect(screen.getByRole('header', { name: 'New stop' })).toBeVisible();
    expect(screen.getByPlaceholderText(TITLE_PLACEHOLDER)).toHaveDisplayValue('');
    expect(screen.getByDisplayValue('09:00')).toBeVisible();
    expect(screen.getByDisplayValue('60')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Delete stop' })).toBeNull();
  });

  it('saves the stop on the first day of the trip, then goes back', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NewStop />);

    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), 'Dinner');
    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(useStopsStore.getState().stops).toEqual([
      expect.objectContaining({
        tripId: 'lisbon',
        title: 'Dinner',
        date: '2026-12-13',
        type: 'attraction',
        startTime: '09:00',
        durationMin: 60,
        coordinates: null,
      }),
    ]);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('does not save a stop without a title', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NewStop />);

    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(screen.getByText('Enter a title')).toBeVisible();
    expect(useStopsStore.getState().stops).toHaveLength(0);
  });

  it('starts on the requested day of the trip', async () => {
    setParams({ id: 'lisbon', date: '2026-12-14' });
    const user = userEvent.setup();
    await renderWithProviders(<NewStop />);

    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), 'Tram 28');
    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(useStopsStore.getState().stops[0]).toEqual(expect.objectContaining({ date: '2026-12-14' }));
  });

  it('starts on the first day of the trip when the requested day is outside it', async () => {
    setParams({ id: 'lisbon', date: '2026-12-30' });
    const user = userEvent.setup();
    await renderWithProviders(<NewStop />);

    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), 'Tram 28');
    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(useStopsStore.getState().stops[0]).toEqual(expect.objectContaining({ date: '2026-12-13' }));
  });

  it('starts today, not on the first day, when the trip has already begun', async () => {
    jest.setSystemTime(new Date(2026, 11, 14, 12, 0));
    const user = userEvent.setup();
    await renderWithProviders(<NewStop />);

    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), 'Tram 28');
    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(useStopsStore.getState().stops[0]).toEqual(expect.objectContaining({ date: '2026-12-14' }));
  });

  it('ignores a requested day that is already in the past', async () => {
    jest.setSystemTime(new Date(2026, 11, 14, 12, 0));
    setParams({ id: 'lisbon', date: '2026-12-13' });
    const user = userEvent.setup();
    await renderWithProviders(<NewStop />);

    await user.type(screen.getByPlaceholderText(TITLE_PLACEHOLDER), 'Tram 28');
    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(useStopsStore.getState().stops[0]).toEqual(expect.objectContaining({ date: '2026-12-14' }));
  });

  it('sends the user to the trip when every day of it is in the past', async () => {
    jest.setSystemTime(new Date(2026, 11, 20, 12, 0));
    await renderWithProviders(<NewStop />);

    expect(screen.getByTestId('redirect')).toHaveTextContent(
      JSON.stringify({ pathname: '/trip/[id]', params: { id: 'lisbon' } }),
    );
  });

  it('sends the user to the trip list when the trip does not exist', async () => {
    setParams({ id: 'unknown' });
    await renderWithProviders(<NewStop />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('"/"');
  });
});
