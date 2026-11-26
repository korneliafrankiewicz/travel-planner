import { screen, userEvent } from '@testing-library/react-native';

import { resetRouter, router, setParams } from '@/test-utils/expoRouterMock';
import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { useTripsStore, type Trip } from '../TripList/store/tripsStore';
import EditTrip from './EditTrip';

jest.mock('expo-router', () => jest.requireActual('@/test-utils/expoRouterMock').expoRouterModule);

const lisbon: Trip = {
  id: 'lisbon',
  title: 'Lisbon city break',
  destination: 'Lisbon, Portugal',
  notes: 'Book the tram tickets',
  startDate: '2026-12-13',
  endDate: '2026-12-15',
};

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  resetRouter();
  setParams({ id: 'lisbon' });
  useTripsStore.setState({ trips: [lisbon] });
});

afterEach(() => {
  jest.useRealTimers();
});

describe('EditTrip screen', () => {
  it('shows the trip in the form', async () => {
    await renderWithProviders(<EditTrip />);

    expect(screen.getByRole('header', { name: 'Edit trip' })).toBeVisible();
    expect(screen.getByDisplayValue('Lisbon city break')).toBeVisible();
    expect(screen.getByDisplayValue('Lisbon, Portugal')).toBeVisible();
    expect(screen.getByDisplayValue('Book the tram tickets')).toBeVisible();
    expect(screen.getByText('3 days')).toBeVisible();
  });

  it('saves the changes to the same trip, then goes back', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<EditTrip />);

    const title = screen.getByDisplayValue('Lisbon city break');
    await user.clear(title);
    await user.type(title, 'Lisbon in winter');
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(useTripsStore.getState().trips).toEqual([{ ...lisbon, title: 'Lisbon in winter' }]);
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('does not save a trip without a title', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<EditTrip />);

    await user.clear(screen.getByDisplayValue('Lisbon city break'));
    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(screen.getByText('Enter a trip title')).toBeVisible();
    expect(useTripsStore.getState().trips).toEqual([lisbon]);
  });

  it('keeps the start date of a trip that has already begun', async () => {
    const user = userEvent.setup();
    useTripsStore.setState({ trips: [{ ...lisbon, startDate: '2026-11-10', endDate: '2026-11-25' }] });
    await renderWithProviders(<EditTrip />);

    await user.press(screen.getByRole('button', { name: 'Save changes' }));

    expect(useTripsStore.getState().trips[0]).toEqual(
      expect.objectContaining({ startDate: '2026-11-10', endDate: '2026-11-25' }),
    );
  });

  it('sends the user to the trip list when the trip does not exist', async () => {
    setParams({ id: 'unknown' });
    await renderWithProviders(<EditTrip />);

    expect(screen.getByTestId('redirect')).toHaveTextContent('"/"');
    expect(screen.queryByRole('header', { name: 'Edit trip' })).toBeNull();
  });
});
