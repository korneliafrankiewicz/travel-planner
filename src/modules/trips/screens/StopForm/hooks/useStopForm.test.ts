import { act, renderHook } from '@testing-library/react-native';

import type { StopFormValues } from '../schema/stopFormSchema';
import { useStopForm } from './useStopForm';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack }),
}));

const trip = { startDate: '2026-12-13', endDate: '2026-12-15' };

const initialValues: StopFormValues = {
  type: 'attraction',
  title: '',
  date: '2026-12-14',
  startTime: '09:00',
  duration: '60',
  notes: '',
  url: '',
  latitude: '',
  longitude: '',
};

const renderForm = (options: { keepDate?: string | null; values?: Partial<StopFormValues> } = {}) => {
  const onSave = jest.fn();
  return {
    onSave,
    rendered: renderHook(() =>
      useStopForm({
        trip,
        initialValues: { ...initialValues, ...options.values },
        keepDate: options.keepDate ?? null,
        onSave,
      }),
    ),
  };
};

beforeEach(() => {
  // "Today" is 14 December 2026, in the middle of the trip.
  jest.useFakeTimers({ now: new Date(2026, 11, 14, 12, 0), advanceTimers: true });
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack = true;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('days to choose from', () => {
  it('lists every day of the trip and disables the ones before today', async () => {
    const { result } = await renderForm().rendered;
    expect(result.current.days).toEqual([
      { date: '2026-12-13', dayNumber: 1, disabled: true },
      { date: '2026-12-14', dayNumber: 2, disabled: false },
      { date: '2026-12-15', dayNumber: 3, disabled: false },
    ]);
  });

  it('keeps the stop’s own past day selectable when editing (keepDate)', async () => {
    const { result } = await renderForm({ keepDate: '2026-12-13' }).rendered;
    expect(result.current.days[0]).toEqual({ date: '2026-12-13', dayNumber: 1, disabled: false });
  });

  it('adds the stop’s own day when it is outside the trip, without a day number', async () => {
    const { result } = await renderForm({ keepDate: '2026-12-20' }).rendered;
    expect(result.current.days.at(-1)).toEqual({ date: '2026-12-20', dayNumber: null, disabled: false });
    expect(result.current.days).toHaveLength(4);
  });

  it('puts an extra day before the trip first', async () => {
    const { result } = await renderForm({ keepDate: '2026-12-10' }).rendered;
    expect(result.current.days[0].date).toBe('2026-12-10');
  });
});

describe('editing values', () => {
  it('updates a field', async () => {
    const { result } = await renderForm().rendered;
    await act(() => result.current.setField('title', 'Dinner'));
    expect(result.current.values.title).toBe('Dinner');
  });

  it('updates the stop type and the day', async () => {
    const { result } = await renderForm().rendered;
    await act(() => {
      result.current.setField('type', 'lodging');
      result.current.setField('date', '2026-12-15');
    });
    expect(result.current.values).toMatchObject({ type: 'lodging', date: '2026-12-15' });
  });
});

describe('errors', () => {
  it('are not shown before the first save attempt', async () => {
    const { result } = await renderForm().rendered;
    expect(result.current.errors).toEqual({});
  });

  it('are shown after a failed save and clear as the user fixes the form', async () => {
    const { result } = await renderForm().rendered;

    await act(() => result.current.submit());
    expect(result.current.errors).toEqual({ title: 'stop.errors.titleRequired' });

    await act(() => result.current.setField('title', 'Dinner'));
    expect(result.current.errors).toEqual({});
  });
});

describe('submit', () => {
  it('does not save or close when the form is invalid', async () => {
    const { onSave, rendered } = renderForm();
    const { result } = await rendered;

    await act(() => result.current.submit());

    expect(onSave).not.toHaveBeenCalled();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('saves the cleaned values and closes the screen', async () => {
    const { onSave, rendered } = renderForm({
      values: { title: '  Dinner  ', duration: '90', startTime: '19:30', type: 'meal' },
    });
    const { result } = await rendered;

    await act(() => result.current.submit());

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      type: 'meal',
      title: 'Dinner',
      date: '2026-12-14',
      startTime: '19:30',
      durationMin: 90,
      notes: '',
      url: '',
      coordinates: null,
    });
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('refuses a stop on a past day', async () => {
    const { onSave, rendered } = renderForm({ values: { title: 'Old', date: '2026-12-13' } });
    const { result } = await rendered;

    await act(() => result.current.submit());

    expect(onSave).not.toHaveBeenCalled();
    expect(result.current.errors).toEqual({ date: 'stop.errors.pastDate' });
  });

  it('accepts the stop’s own past day when editing', async () => {
    const { onSave, rendered } = renderForm({
      keepDate: '2026-12-13',
      values: { title: 'Old', date: '2026-12-13' },
    });
    const { result } = await rendered;

    await act(() => result.current.submit());

    expect(onSave).toHaveBeenCalledTimes(1);
  });
});

describe('close', () => {
  it('goes back when it can', async () => {
    const { result } = await renderForm().rendered;
    await act(() => result.current.close());
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('goes to the home screen when there is nothing to go back to (e.g. a direct link)', async () => {
    mockCanGoBack = false;
    const { result } = await renderForm().rendered;
    await act(() => result.current.close());
    expect(mockReplace).toHaveBeenCalledWith('/');
    expect(mockBack).not.toHaveBeenCalled();
  });
});
