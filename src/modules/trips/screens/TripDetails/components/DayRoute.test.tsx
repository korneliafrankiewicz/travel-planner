import { screen, userEvent } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Stop } from '../../TripList/schema/stopSchema';
import { DayRoute } from './DayRoute';

const lisbon = { latitude: 38.7223, longitude: -9.1393 };
const belem = { latitude: 38.6916, longitude: -9.216 };
const sintra = { latitude: 38.7876, longitude: -9.3906 };

const makeStop = (id: string, coordinates: Stop['coordinates']): Stop => ({
  id,
  tripId: 't',
  date: '2026-12-13',
  type: 'attraction',
  title: id,
  startTime: '09:00',
  durationMin: 30,
  notes: '',
  url: '',
  coordinates,
});

const day = [makeStop('Hotel', lisbon), makeStop('Belém Tower', belem), makeStop('Sintra', sintra)];

afterEach(() => {
  jest.restoreAllMocks();
});

const toggle = (name: RegExp) => screen.getByRole('button', { name });

describe('DayRoute', () => {
  it('shows nothing when fewer than two stops have a place', async () => {
    const { toJSON } = await renderWithProviders(
      <DayRoute stops={[makeStop('a', lisbon), makeStop('b', null)]} />,
    );
    expect(toJSON()).toBeNull();
  });

  it('shows nothing for a day without stops', async () => {
    const { toJSON } = await renderWithProviders(<DayRoute stops={[]} />);
    expect(toJSON()).toBeNull();
  });

  it('starts closed, with the number of stops and the total distance', async () => {
    await renderWithProviders(<DayRoute stops={day} />);

    expect(screen.getByText('Show route on map')).toBeVisible();
    // Hotel → Belém is 7.5 km and Belém → Sintra 18.5 km in a straight line.
    expect(screen.getByText('3 stops · 26 km')).toBeVisible();
    expect(toggle(/Show route on map/)).toBeCollapsed();
    expect(screen.queryByTestId('map-view')).toBeNull();
  });

  it('opens a map with a numbered pin per stop and one line through them in order', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<DayRoute stops={day} />);

    await user.press(toggle(/Show route on map/));

    expect(toggle(/Hide route/)).toBeExpanded();
    expect(screen.getByTestId('map-view')).toBeVisible();
    expect(screen.getByRole('button', { name: 'pin: Hotel' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'pin: Belém Tower' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'pin: Sintra' })).toBeVisible();
    for (const number of ['1', '2', '3']) {
      expect(screen.getByText(number)).toBeVisible();
    }
    expect(screen.getByLabelText(/^line: /).props.accessibilityLabel).toBe(
      `line: ${[lisbon, belem, sintra].map((c) => `${c.latitude},${c.longitude}`).join(' ')}`,
    );
  });

  it('writes the distance of each leg on the map and in a list', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<DayRoute stops={day} />);

    await user.press(toggle(/Show route on map/));

    // Once on the map next to the line, once in the list under it.
    expect(screen.getAllByText('7.5 km')).toHaveLength(2);
    expect(screen.getAllByText('18.5 km')).toHaveLength(2);
    expect(screen.getByText('1. Hotel → 2. Belém Tower')).toBeVisible();
    expect(screen.getByText('2. Belém Tower → 3. Sintra')).toBeVisible();
    expect(screen.getByLabelText('From Hotel to Belém Tower, 7.5 km')).toBeVisible();
  });

  it('says the distances are straight lines', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<DayRoute stops={day} />);

    await user.press(toggle(/Show route on map/));

    expect(screen.getByText(/in a straight line between stops/)).toBeVisible();
  });

  it('numbers only the stops that have a place and skips the others', async () => {
    const user = userEvent.setup();
    await renderWithProviders(
      <DayRoute stops={[makeStop('Hotel', lisbon), makeStop('Lunch', null), makeStop('Sintra', sintra)]} />,
    );

    await user.press(toggle(/Show route on map/));

    expect(screen.queryByRole('button', { name: 'pin: Lunch' })).toBeNull();
    expect(screen.getByText('1. Hotel → 2. Sintra')).toBeVisible();
    // Hotel → Sintra is 23 km in a straight line.
    expect(screen.getByText('2 stops · 23 km')).toBeVisible();
  });

  it('closes again, removing the map', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<DayRoute stops={day} />);

    await user.press(toggle(/Show route on map/));
    await user.press(toggle(/Hide route/));

    expect(screen.queryByTestId('map-view')).toBeNull();
    expect(screen.getByText('Show route on map')).toBeVisible();
  });

  it('writes distances with a decimal comma in Polish', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<DayRoute stops={day} />, { language: 'pl' });

    await user.press(toggle(/Pokaż trasę na mapie/));

    expect(screen.getAllByText('7,5 km')).toHaveLength(2);
    expect(screen.getByText('3 punkty · 26 km')).toBeVisible();
  });

  it('lists the distances without a map on the web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    const user = userEvent.setup();
    await renderWithProviders(<DayRoute stops={day} />);

    await user.press(toggle(/Show route on map/));

    expect(screen.queryByTestId('map-view')).toBeNull();
    expect(screen.getByText('1. Hotel → 2. Belém Tower')).toBeVisible();
    expect(screen.getByText('7.5 km')).toBeVisible();
  });
});
