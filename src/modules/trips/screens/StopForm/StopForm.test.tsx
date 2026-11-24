import { fireEvent, screen, userEvent, within } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { StopInput } from '../TripList/schema/stopSchema';
import { StopForm } from './StopForm';
import { useStopForm } from './hooks/useStopForm';
import type { StopFormValues } from './schema/stopFormSchema';

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));

const trip = { startDate: '2026-12-13', endDate: '2026-12-15' };

const emptyValues: StopFormValues = {
  type: 'attraction',
  title: 'Belém Tower',
  date: '2026-12-14',
  startTime: '10:00',
  duration: '90',
  notes: '',
  url: '',
  latitude: '',
  longitude: '',
};

type HarnessProps = {
  values?: Partial<StopFormValues>;
  onSave: (input: StopInput) => void;
};

const Harness = ({ values, onSave }: HarnessProps) => {
  const form = useStopForm({
    trip,
    initialValues: { ...emptyValues, ...values },
    keepDate: null,
    onSave,
  });
  return (
    <StopForm title="New stop" submitLabel="Save stop" form={form} />
  );
};

const renderForm = (values?: Partial<StopFormValues>) => {
  const onSave = jest.fn();
  return { onSave, ready: renderWithProviders(<Harness values={values} onSave={onSave} />) };
};

const PICKER_MAP = 'Map for choosing a location';
const PREVIEW_MAP = 'Map showing where the stop is';

const tapMap = async (latitude: number, longitude: number) =>
  await fireEvent(screen.getByLabelText(PICKER_MAP), 'press', {
    nativeEvent: { coordinate: { latitude, longitude } },
  });

beforeEach(() => {
  // "Today" is 14 December 2026, in the middle of the trip.
  jest.useFakeTimers({ now: new Date(2026, 11, 14, 12, 0), advanceTimers: true });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('StopForm location', () => {
  it('fills in the coordinates from a place chosen on the map, and saves them', async () => {
    const user = userEvent.setup();
    const { onSave, ready } = renderForm();
    await ready;

    await user.press(screen.getByRole('button', { name: 'Choose on map' }));
    await tapMap(38.69163, -9.21602);
    await user.press(screen.getByRole('button', { name: 'Use this location' }));

    // The picker is closed and the chosen place is in the fields.
    expect(screen.queryByLabelText(PICKER_MAP)).toBeNull();
    expect(screen.getByDisplayValue('38.69163')).toBeVisible();
    expect(screen.getByDisplayValue('-9.21602')).toBeVisible();

    await user.press(screen.getByRole('button', { name: 'Save stop' }));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ coordinates: { latitude: 38.69163, longitude: -9.21602 } }),
    );
  });

  it('leaves the fields empty when the picker is cancelled', async () => {
    const user = userEvent.setup();
    const { onSave, ready } = renderForm();
    await ready;

    await user.press(screen.getByRole('button', { name: 'Choose on map' }));
    await tapMap(38.7, -9.1);
    // The form stays mounted behind the picker, so there are two Cancel buttons; the picker's
    // is the last one.
    await user.press(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!);

    expect(screen.queryByLabelText(PICKER_MAP)).toBeNull();
    expect(screen.queryByDisplayValue('38.7')).toBeNull();

    await user.press(screen.getByRole('button', { name: 'Save stop' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ coordinates: null }));
  });

  it('opens on the place already in the fields, and offers to change it', async () => {
    const user = userEvent.setup();
    const { ready } = renderForm({ latitude: '49,2992', longitude: '19.9496' });
    await ready;

    await user.press(screen.getByRole('button', { name: 'Change on map' }));

    // The preview behind the picker has a pin for the same place, so look inside the picker.
    const pickerMap = screen.getByLabelText(PICKER_MAP);
    expect(within(pickerMap).getByRole('button', { name: 'pin at 49.2992, 19.9496' })).toBeVisible();
  });

  it('opens without a pin when the fields hold something that is not a place yet', async () => {
    const user = userEvent.setup();
    const { ready } = renderForm({ latitude: '49.2', longitude: '' });
    await ready;

    await user.press(screen.getByRole('button', { name: 'Choose on map' }));

    expect(screen.queryByTestId('map-pin')).toBeNull();
  });

  it('replaces the place when a new one is chosen', async () => {
    const user = userEvent.setup();
    const { onSave, ready } = renderForm({ latitude: '49.2992', longitude: '19.9496' });
    await ready;

    await user.press(screen.getByRole('button', { name: 'Change on map' }));
    await tapMap(38.7, -9.1);
    await user.press(screen.getByRole('button', { name: 'Use this location' }));
    await user.press(screen.getByRole('button', { name: 'Save stop' }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ coordinates: { latitude: 38.7, longitude: -9.1 } }),
    );
  });

  it('clears the place', async () => {
    const user = userEvent.setup();
    const { onSave, ready } = renderForm({ latitude: '49.2992', longitude: '19.9496' });
    await ready;

    await user.press(screen.getByRole('button', { name: 'Clear location' }));

    expect(screen.queryByDisplayValue('49.2992')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear location' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Choose on map' })).toBeVisible();

    await user.press(screen.getByRole('button', { name: 'Save stop' }));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ coordinates: null }));
  });

  it('does not offer to clear when there is nothing to clear', async () => {
    await renderForm().ready;
    expect(screen.queryByRole('button', { name: 'Clear location' })).toBeNull();
  });

  it('hides the map button on the web, where only typing coordinates works', async () => {
    jest.replaceProperty(Platform, 'OS', 'web');
    await renderForm().ready;

    expect(screen.queryByRole('button', { name: 'Choose on map' })).toBeNull();
    expect(screen.getByText('Latitude')).toBeVisible();
  });

  describe('preview of the place', () => {
    it('shows no map while the stop has no place', async () => {
      await renderForm().ready;
      expect(screen.queryByLabelText(PREVIEW_MAP)).toBeNull();
    });

    it('shows a map with a pin for the place the stop already has', async () => {
      await renderForm({ latitude: '49.2992', longitude: '19.9496' }).ready;

      expect(screen.getByLabelText(PREVIEW_MAP)).toBeVisible();
      expect(screen.getByRole('button', { name: 'pin at 49.2992, 19.9496' })).toBeVisible();
    });

    it('appears once a place is chosen on the map, and goes when the place is cleared', async () => {
      const user = userEvent.setup();
      await renderForm().ready;

      await user.press(screen.getByRole('button', { name: 'Choose on map' }));
      await tapMap(38.7, -9.1);
      await user.press(screen.getByRole('button', { name: 'Use this location' }));
      expect(screen.getByLabelText(PREVIEW_MAP)).toBeVisible();

      await user.press(screen.getByRole('button', { name: 'Clear location' }));
      expect(screen.queryByLabelText(PREVIEW_MAP)).toBeNull();
    });

    it('does not show a map for coordinates that are not valid yet', async () => {
      await renderForm({ latitude: '49.2992', longitude: '' }).ready;
      expect(screen.queryByLabelText(PREVIEW_MAP)).toBeNull();
    });

    it('is not shown on the web', async () => {
      jest.replaceProperty(Platform, 'OS', 'web');
      await renderForm({ latitude: '49.2992', longitude: '19.9496' }).ready;
      expect(screen.queryByLabelText(PREVIEW_MAP)).toBeNull();
    });
  });
});
