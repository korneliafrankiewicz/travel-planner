import { validateNewTrip, type NewTripValues } from './newTripSchema';

const TODAY = '2026-11-20';
const options = { today: TODAY };

const values: NewTripValues = {
  title: '  Rome  ',
  destination: ' Rome, Italy ',
  notes: ' n ',
  startDate: '2026-12-01',
  endDate: '2026-12-03',
};

describe('validateNewTrip', () => {
  it('accepts a valid trip and trims the text', () => {
    const result = validateNewTrip(values, options);
    expect(result).toEqual({
      success: true,
      data: {
        title: 'Rome',
        destination: 'Rome, Italy',
        notes: 'n',
        startDate: '2026-12-01',
        endDate: '2026-12-03',
      },
    });
  });

  it('accepts an empty destination and empty notes', () => {
    expect(validateNewTrip({ ...values, destination: '', notes: '' }, options).success).toBe(true);
  });

  describe('title', () => {
    it.each(['', '   ', '\t\n'])('is required: %p', (title) => {
      expect(validateNewTrip({ ...values, title }, options)).toEqual({
        success: false,
        errors: { title: 'form.errors.titleRequired' },
      });
    });
  });

  describe('dates', () => {
    it('requires both dates', () => {
      for (const override of [
        { startDate: null, endDate: null },
        { endDate: null },
        { startDate: null },
      ]) {
        expect(validateNewTrip({ ...values, ...override }, options)).toEqual({
          success: false,
          errors: { dates: 'form.errors.datesRequired' },
        });
      }
    });

    it('rejects impossible dates and garbage', () => {
      for (const startDate of ['2026-02-31', 'tomorrow', '']) {
        const result = validateNewTrip({ ...values, startDate }, options);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.errors.dates).toBe('form.errors.datesRequired');
        }
      }
    });

    it('rejects a start date before today (trips are planned in advance)', () => {
      expect(
        validateNewTrip({ ...values, startDate: '2026-11-19', endDate: '2026-11-25' }, options),
      ).toEqual({ success: false, errors: { dates: 'form.errors.pastDate' } });
    });

    it('accepts today as the start date, including a one-day trip', () => {
      expect(
        validateNewTrip({ ...values, startDate: TODAY, endDate: TODAY }, options).success,
      ).toBe(true);
    });

    it('rejects an end date before the start date', () => {
      expect(
        validateNewTrip({ ...values, startDate: '2026-12-05', endDate: '2026-12-01' }, options),
      ).toEqual({ success: false, errors: { dates: 'form.errors.endBeforeStart' } });
    });
  });

  describe('editing a trip that already started', () => {
    const started: NewTripValues = { ...values, startDate: '2026-11-10', endDate: '2026-11-25' };

    it('accepts the unchanged past start date (keepStartDate)', () => {
      expect(validateNewTrip(started, { today: TODAY, keepStartDate: '2026-11-10' }).success).toBe(
        true,
      );
    });

    it('rejects moving the start to a different past date', () => {
      expect(
        validateNewTrip(
          { ...started, startDate: '2026-11-12' },
          { today: TODAY, keepStartDate: '2026-11-10' },
        ),
      ).toEqual({ success: false, errors: { dates: 'form.errors.pastDate' } });
    });

    it('accepts moving the trip to a future range', () => {
      expect(
        validateNewTrip(
          { ...started, startDate: '2026-12-02', endDate: '2026-12-04' },
          { today: TODAY, keepStartDate: '2026-11-10' },
        ).success,
      ).toBe(true);
    });

    it('still rejects the same past start date for a brand-new trip', () => {
      expect(validateNewTrip(started, { today: TODAY })).toEqual({
        success: false,
        errors: { dates: 'form.errors.pastDate' },
      });
    });
  });

  it('reports a title error and a date error together', () => {
    expect(
      validateNewTrip({ ...values, title: '', startDate: '2026-01-01', endDate: '2026-01-02' }, options),
    ).toEqual({
      success: false,
      errors: { title: 'form.errors.titleRequired', dates: 'form.errors.pastDate' },
    });
  });
});
