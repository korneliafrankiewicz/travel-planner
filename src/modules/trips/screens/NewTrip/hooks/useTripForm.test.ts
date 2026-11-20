import { act, renderHook } from '@testing-library/react-native';

import { emptyNewTripValues, type NewTripValues } from '../schema/newTripSchema';
import { useTripForm } from './useTripForm';

const mockBack = jest.fn();
const mockReplace = jest.fn();
let mockCanGoBack = true;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, replace: mockReplace, canGoBack: () => mockCanGoBack }),
}));

const renderForm = (initialValues: NewTripValues = emptyNewTripValues) => {
  const onSave = jest.fn();
  return { onSave, rendered: renderHook(() => useTripForm(initialValues, onSave)) };
};

beforeEach(() => {
  // "Today" is 20 November 2026.
  jest.useFakeTimers({ now: new Date(2026, 10, 20, 12, 0), advanceTimers: true });
  mockBack.mockClear();
  mockReplace.mockClear();
  mockCanGoBack = true;
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useTripForm', () => {
  it('exposes today, so the calendar can disable earlier days', async () => {
    const { result } = await renderForm().rendered;
    expect(result.current.today).toBe('2026-11-20');
  });

  it('starts empty, without errors', async () => {
    const { result } = await renderForm().rendered;
    expect(result.current.values).toEqual(emptyNewTripValues);
    expect(result.current.errors).toEqual({});
  });

  describe('selectDate', () => {
    it('picks a start and then an end date', async () => {
      const { result } = await renderForm().rendered;

      await act(() => result.current.selectDate('2026-12-13'));
      expect(result.current.values).toMatchObject({ startDate: '2026-12-13', endDate: null });

      await act(() => result.current.selectDate('2026-12-15'));
      expect(result.current.values).toMatchObject({ startDate: '2026-12-13', endDate: '2026-12-15' });
    });

    it('accepts today', async () => {
      const { result } = await renderForm().rendered;
      await act(() => result.current.selectDate('2026-11-20'));
      expect(result.current.values.startDate).toBe('2026-11-20');
    });

    it('ignores a day in the past (trips are planned in advance)', async () => {
      const { result } = await renderForm().rendered;
      await act(() => result.current.selectDate('2026-11-19'));
      expect(result.current.values).toMatchObject({ startDate: null, endDate: null });
    });

    it('does not let a past day replace a range that is already chosen', async () => {
      const { result } = await renderForm().rendered;
      await act(() => result.current.selectDate('2026-12-13'));
      await act(() => result.current.selectDate('2026-12-15'));
      await act(() => result.current.selectDate('2026-01-01'));
      expect(result.current.values).toMatchObject({ startDate: '2026-12-13', endDate: '2026-12-15' });
    });
  });

  describe('submit', () => {
    it('shows errors and does not save an empty form', async () => {
      const { onSave, rendered } = renderForm();
      const { result } = await rendered;

      await act(() => result.current.submit());

      expect(onSave).not.toHaveBeenCalled();
      expect(mockBack).not.toHaveBeenCalled();
      expect(result.current.errors).toEqual({
        title: 'form.errors.titleRequired',
        dates: 'form.errors.datesRequired',
      });
    });

    it('saves a valid trip with trimmed text, then closes', async () => {
      const { onSave, rendered } = renderForm();
      const { result } = await rendered;

      await act(() => {
        result.current.setField('title', '  Rome  ');
        result.current.setField('destination', ' Italy ');
        result.current.selectDate('2026-12-13');
      });
      await act(() => result.current.selectDate('2026-12-15'));
      await act(() => result.current.submit());

      expect(onSave).toHaveBeenCalledWith({
        title: 'Rome',
        destination: 'Italy',
        notes: '',
        startDate: '2026-12-13',
        endDate: '2026-12-15',
      });
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('lets a trip that already started keep its start date when editing', async () => {
      const { onSave, rendered } = renderForm({
        title: 'Ongoing',
        destination: '',
        notes: '',
        startDate: '2026-11-10',
        endDate: '2026-11-25',
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
    });

    it('goes to the home screen when there is nothing to go back to', async () => {
      mockCanGoBack = false;
      const { result } = await renderForm().rendered;
      await act(() => result.current.close());
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });
});
