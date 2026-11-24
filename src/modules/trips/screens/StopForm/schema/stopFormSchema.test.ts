import { validateStopForm, type StopFormValues } from './stopFormSchema';

const values: StopFormValues = {
  type: 'meal',
  title: '  Dinner  ',
  date: '2026-12-14',
  startTime: '19:30',
  duration: '90',
  notes: ' n ',
  url: '',
  latitude: '',
  longitude: '',
};

const options: Parameters<typeof validateStopForm>[1] = {
  today: '2026-11-20',
  tripStart: '2026-12-13',
  tripEnd: '2026-12-15',
  keepDate: null,
};

const errorsOf = (override: Partial<StopFormValues>, schemaOptions = options) => {
  const result = validateStopForm({ ...values, ...override }, schemaOptions);
  return result.success ? null : result.errors;
};

describe('validateStopForm', () => {
  it('accepts a valid stop, trims the text and turns the duration into a number', () => {
    expect(validateStopForm(values, options)).toEqual({
      success: true,
      data: {
        type: 'meal',
        title: 'Dinner',
        date: '2026-12-14',
        startTime: '19:30',
        durationMin: 90,
        notes: 'n',
        url: '',
        coordinates: null,
      },
    });
  });

  it('does not leak the form-only `duration` field into the result', () => {
    const result = validateStopForm(values, options);
    expect(result.success && 'duration' in result.data).toBe(false);
  });

  describe('title', () => {
    it.each(['', '   '])('is required: %p', (title) => {
      expect(errorsOf({ title })).toEqual({ title: 'stop.errors.titleRequired' });
    });
  });

  describe('start time', () => {
    it.each(['9:30', '12:60', 'abc', ''])('rejects %p', (startTime) => {
      expect(errorsOf({ startTime })).toEqual({ startTime: 'stop.errors.timeInvalid' });
    });

    // KNOWN BUG: an hour that is out of range ("24:00", "25:00") also triggers the misleading
    // "must end by midnight" error on the duration field. These tests describe the intended
    // behaviour and are expected to fail until the schema is fixed (then switch to `it.each`).
    it.failing.each(['25:00', '24:00'])('rejects %p with only a time error', (startTime) => {
      expect(errorsOf({ startTime })).toEqual({ startTime: 'stop.errors.timeInvalid' });
    });

    it.each(['00:00', '09:05', '23:59'])('accepts %s', (startTime) => {
      expect(errorsOf({ startTime, duration: '0' })).toBeNull();
    });
  });

  describe('duration', () => {
    it.each(['', 'abc', '-5', '1.5', '1441', '12345', ' '])('rejects %p', (duration) => {
      expect(errorsOf({ duration })).toEqual({ duration: 'stop.errors.durationInvalid' });
    });

    it('accepts 0 (no duration)', () => {
      expect(errorsOf({ duration: '0' })).toBeNull();
    });

    it('rejects a stop that would run past midnight', () => {
      expect(errorsOf({ startTime: '23:00', duration: '90' })).toEqual({
        duration: 'stop.errors.endsAfterMidnight',
      });
    });

    it('accepts a stop that ends exactly at midnight', () => {
      expect(errorsOf({ startTime: '23:00', duration: '60' })).toBeNull();
    });
  });

  describe('day', () => {
    it('rejects the day after the trip', () => {
      expect(errorsOf({ date: '2026-12-16' })).toEqual({ date: 'stop.errors.dayOutOfRange' });
    });

    it('rejects the day before the trip', () => {
      expect(errorsOf({ date: '2026-12-12' })).toEqual({ date: 'stop.errors.dayOutOfRange' });
    });

    it('accepts the first and the last day of the trip', () => {
      expect(errorsOf({ date: '2026-12-13' })).toBeNull();
      expect(errorsOf({ date: '2026-12-15' })).toBeNull();
    });

    it('rejects an invalid date', () => {
      expect(errorsOf({ date: '2026-02-31' })).toEqual({ date: 'stop.errors.dateInvalid' });
    });

    it('rejects a day in the past, even inside the trip (stops are planned in advance)', () => {
      expect(errorsOf({ date: '2026-12-14' }, { ...options, today: '2026-12-15' })).toEqual({
        date: 'stop.errors.pastDate',
      });
    });

    it('accepts today', () => {
      expect(errorsOf({ date: '2026-12-14' }, { ...options, today: '2026-12-14' })).toBeNull();
    });
  });

  describe('editing a stop (keepDate)', () => {
    it('accepts the stop’s own day even though it is in the past', () => {
      expect(
        errorsOf(
          { date: '2026-12-14' },
          { ...options, today: '2026-12-15', keepDate: '2026-12-14' },
        ),
      ).toBeNull();
    });

    it('rejects moving it to a different past day', () => {
      expect(
        errorsOf(
          { date: '2026-12-13' },
          { ...options, today: '2026-12-15', keepDate: '2026-12-14' },
        ),
      ).toEqual({ date: 'stop.errors.pastDate' });
    });

    it('accepts the stop’s own day even when it is outside the trip dates', () => {
      expect(errorsOf({ date: '2026-12-20' }, { ...options, keepDate: '2026-12-20' })).toBeNull();
    });
  });

  describe('link', () => {
    it.each([
      'http://example.com',
      'javascript:alert(1)',
      'ftp://example.com',
      'example.com',
      'https://',
      'https:// space.com',
      'https://a.com/ b',
    ])('rejects %p', (url) => {
      expect(errorsOf({ url })).toEqual({ url: 'stop.errors.urlInvalid' });
    });

    it.each([
      '',
      'https://www.booking.com/hotel/pt/x.html?a=1#b',
      'HTTPS://EXAMPLE.COM',
      '  https://example.com  ',
    ])('accepts %p', (url) => {
      expect(errorsOf({ url })).toBeNull();
    });

    it('trims the link', () => {
      const result = validateStopForm({ ...values, url: '  https://example.com  ' }, options);
      expect(result.success && result.data.url).toBe('https://example.com');
    });
  });

  it('rejects an unknown type', () => {
    const result = validateStopForm({ ...values, type: 'spaceship' as never }, options);
    expect(result.success).toBe(false);
  });

  it('reports one error per field, together', () => {
    expect(errorsOf({ title: '', startTime: 'x', duration: 'y', url: 'http://a.b' })).toEqual({
      title: 'stop.errors.titleRequired',
      startTime: 'stop.errors.timeInvalid',
      duration: 'stop.errors.durationInvalid',
      url: 'stop.errors.urlInvalid',
    });
  });

  describe('coordinates', () => {
    const coordinatesOf = (override: Partial<StopFormValues>) => {
      const result = validateStopForm({ ...values, ...override }, options);
      return result.success ? result.data.coordinates : 'invalid';
    };

    it('are optional: both empty means no place', () => {
      expect(coordinatesOf({ latitude: '', longitude: '' })).toBeNull();
      expect(coordinatesOf({ latitude: '  ', longitude: '  ' })).toBeNull();
    });

    it('become numbers when both are filled in', () => {
      expect(coordinatesOf({ latitude: '38.7223', longitude: '-9.1393' })).toEqual({
        latitude: 38.7223,
        longitude: -9.1393,
      });
    });

    it('accept a decimal comma, as typed on a Polish keyboard', () => {
      expect(coordinatesOf({ latitude: '49,2992', longitude: '19,9496' })).toEqual({
        latitude: 49.2992,
        longitude: 19.9496,
      });
    });

    it('accept the limits of the range', () => {
      expect(coordinatesOf({ latitude: '-90', longitude: '180' })).toEqual({
        latitude: -90,
        longitude: 180,
      });
    });

    it('need both values: a single one points at the missing one', () => {
      expect(errorsOf({ latitude: '38.7', longitude: '' })).toEqual({
        longitude: 'stop.errors.longitudeInvalid',
      });
      expect(errorsOf({ latitude: '', longitude: '-9.1' })).toEqual({
        latitude: 'stop.errors.latitudeInvalid',
      });
    });

    it.each(['abc', '91', '-90.5', '1e3', '38.7.2', '38.'])('reject a latitude of %p', (latitude) => {
      expect(errorsOf({ latitude, longitude: '-9.1' })).toEqual({
        latitude: 'stop.errors.latitudeInvalid',
      });
    });

    it.each(['abc', '181', '-180.1', '1e3'])('reject a longitude of %p', (longitude) => {
      expect(errorsOf({ latitude: '38.7', longitude })).toEqual({
        longitude: 'stop.errors.longitudeInvalid',
      });
    });

    it('report both fields when both are wrong', () => {
      expect(errorsOf({ latitude: 'x', longitude: 'y' })).toEqual({
        latitude: 'stop.errors.latitudeInvalid',
        longitude: 'stop.errors.longitudeInvalid',
      });
    });
  });
});
