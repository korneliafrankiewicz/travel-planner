import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { useTripsStore } from '../TripList/store/tripsStore';
import NewTrip from './NewTrip';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

// Days are buttons named with their full date, e.g. "Sunday, December 13, 2026".
const day = (month: string, dayOfMonth: number) =>
  screen.getByRole('button', {
    name: new RegExp(`${month} ${dayOfMonth}, 2026$`),
    includeHiddenElements: true,
  });

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  useTripsStore.setState({ trips: [] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('NewTrip screen', () => {
  it('shows an empty form', async () => {
    await renderWithProviders(<NewTrip />);

    expect(screen.getByRole('header', { name: 'New trip' })).toBeVisible();
    expect(screen.getByPlaceholderText('e.g. Weekend in Lisbon')).toHaveDisplayValue('');
    expect(screen.getByText('Tap a start date, then an end date')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Save trip' })).toBeVisible();
  });

  it('does not show errors before the first save attempt', async () => {
    await renderWithProviders(<NewTrip />);

    expect(screen.queryByText('Enter a trip title')).toBeNull();
    expect(screen.queryByText('Select a start and an end date')).toBeNull();
  });

  it('shows what is missing and saves nothing when the form is empty', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NewTrip />);

    await user.press(screen.getByRole('button', { name: 'Save trip' }));

    expect(screen.getByText('Enter a trip title')).toBeVisible();
    expect(screen.getByText('Select a start and an end date')).toBeVisible();
    expect(useTripsStore.getState().trips).toHaveLength(0);
    expect(router.back).not.toHaveBeenCalled();
  });

  it('saves the trip, then goes back', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NewTrip />);

    await user.type(screen.getByPlaceholderText('e.g. Weekend in Lisbon'), 'Lisbon break');
    await user.type(screen.getByPlaceholderText('City or country'), 'Lisbon, Portugal');
    await user.type(screen.getByPlaceholderText('Anything worth remembering'), 'Book trams');
    await user.press(screen.getByRole('button', { name: 'Next month' }));
    await user.press(day('December', 13));
    await user.press(day('December', 15));

    // The chosen range is summarised, with its length.
    expect(screen.getByText('3 days')).toBeVisible();

    await user.press(screen.getByRole('button', { name: 'Save trip' }));

    expect(useTripsStore.getState().trips).toEqual([
      expect.objectContaining({
        title: 'Lisbon break',
        destination: 'Lisbon, Portugal',
        notes: 'Book trams',
        startDate: '2026-12-13',
        endDate: '2026-12-15',
      }),
    ]);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('cannot select a day in the past', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NewTrip />);

    await user.press(day('November', 19));

    expect(screen.getByText('Tap a start date, then an end date')).toBeVisible();
  });

  it('closes without saving with Cancel', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<NewTrip />);

    await user.type(screen.getByPlaceholderText('e.g. Weekend in Lisbon'), 'Lisbon break');
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(router.back).toHaveBeenCalledTimes(1);
    expect(useTripsStore.getState().trips).toHaveLength(0);
  });

  it('goes to the trip list when there is no screen to go back to', async () => {
    router.canGoBack.mockReturnValue(false);
    const user = userEvent.setup();
    await renderWithProviders(<NewTrip />);

    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });

  it('is shown in Polish', async () => {
    await renderWithProviders(<NewTrip />, { language: 'pl' });

    expect(screen.getByRole('header', { name: 'Nowa podróż' })).toBeVisible();
  });
});
