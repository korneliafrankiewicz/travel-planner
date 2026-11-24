import { fireEvent, screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { LocationPicker } from './LocationPicker';

const tap = async (latitude: number, longitude: number) =>
  await fireEvent(screen.getByTestId('map-view'), 'press', {
    nativeEvent: { coordinate: { latitude, longitude } },
  });

const renderPicker = (
  props: Partial<React.ComponentProps<typeof LocationPicker>> = {},
  language: 'en' | 'pl' = 'en',
) => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();
  return {
    onConfirm,
    onCancel,
    ready: renderWithProviders(
      <LocationPicker
        visible
        initialCoordinates={null}
        tripPlaces={[]}
        onConfirm={onConfirm}
        onCancel={onCancel}
        {...props}
      />,
      { language },
    ),
  };
};

describe('LocationPicker', () => {
  it('shows nothing while closed', async () => {
    await renderPicker({ visible: false }).ready;
    expect(screen.queryByTestId('map-view')).toBeNull();
  });

  it('starts without a pin and asks to tap the map', async () => {
    await renderPicker().ready;

    expect(screen.getByRole('header', { name: 'Choose location' })).toBeVisible();
    expect(screen.getByText('Tap the map to place the pin')).toBeVisible();
    expect(screen.queryByTestId('map-pin')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Use this location' })).toBeNull();
  });

  it('places the pin where the map is tapped and then offers to use it', async () => {
    await renderPicker().ready;

    await tap(38.7071, -9.1457);

    expect(screen.getByRole('button', { name: 'pin at 38.7071, -9.1457' })).toBeVisible();
    expect(screen.getByText('Drag the pin or tap elsewhere to move it')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Use this location' })).toBeVisible();
  });

  it('moves the pin when the map is tapped again', async () => {
    await renderPicker().ready;

    await tap(38.7, -9.1);
    await tap(40, -8);

    expect(screen.getAllByTestId('map-pin')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'pin at 40, -8' })).toBeVisible();
  });

  it('starts with the pin on the stop’s current place', async () => {
    await renderPicker({ initialCoordinates: { latitude: 49.2992, longitude: 19.9496 } }).ready;
    expect(screen.getByRole('button', { name: 'pin at 49.2992, 19.9496' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Use this location' })).toBeVisible();
  });

  it('confirms the chosen place, rounded and within range', async () => {
    const user = userEvent.setup();
    const { onConfirm, ready } = renderPicker();
    await ready;

    // A map panned past the date line reports a longitude outside -180..180.
    await tap(38.72234567891, 190.5);
    await user.press(screen.getByRole('button', { name: 'Use this location' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith({ latitude: 38.722346, longitude: -169.5 });
  });

  it('cancels without choosing anything', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel, ready } = renderPicker();
    await ready;

    await tap(38.7, -9.1);
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('is translated', async () => {
    await renderPicker({}, 'pl').ready;
    expect(screen.getByRole('header', { name: 'Wybierz lokalizację' })).toBeVisible();
    expect(screen.getByText('Dotknij mapy, aby umieścić pinezkę')).toBeVisible();
  });
});
