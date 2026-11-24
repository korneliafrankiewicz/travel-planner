import {
  HTTPS_URL_PATTERN,
  MAX_DURATION_MINUTES,
  parseStoredStops,
  stopSchema,
  stopTypes,
  TIME_PATTERN,
} from './stopSchema';

const validStop = {
  id: 'stop-1',
  tripId: 'trip-1',
  date: '2026-12-13',
  type: 'meal',
  title: 'Dinner',
  startTime: '19:30',
  durationMin: 90,
  notes: '',
  url: '',
  coordinates: null,
};

describe('TIME_PATTERN', () => {
  it.each(['00:00', '09:05', '12:30', '23:59'])('matches %s', (value) => {
    expect(TIME_PATTERN.test(value)).toBe(true);
  });

  it.each(['24:00', '9:30', '12:60', '12:5', '1230', 'ab:cd', '', '09:30 ', ' 09:30'])(
    'does not match %p',
    (value) => {
      expect(TIME_PATTERN.test(value)).toBe(false);
    },
  );
});

describe('HTTPS_URL_PATTERN', () => {
  it.each([
    'https://example.com',
    'https://www.booking.com/hotel/pt/x.html?a=1#b',
    'HTTPS://EXAMPLE.COM',
    'https://a.b',
  ])('matches %s', (value) => {
    expect(HTTPS_URL_PATTERN.test(value)).toBe(true);
  });

  it.each([
    'http://example.com',
    'javascript:alert(1)',
    'ftp://example.com',
    'example.com',
    'https://',
    'https:// space.com',
    'https://a.com/ b',
    '',
  ])('does not match %p', (value) => {
    expect(HTTPS_URL_PATTERN.test(value)).toBe(false);
  });
});

describe('stopSchema', () => {
  it('accepts a valid stop', () => {
    expect(stopSchema.safeParse(validStop).success).toBe(true);
  });

  it('knows the four stop types', () => {
    expect([...stopTypes]).toEqual(['lodging', 'meal', 'attraction', 'other']);
    for (const type of stopTypes) {
      expect(stopSchema.safeParse({ ...validStop, type }).success).toBe(true);
    }
  });

  it('accepts an empty link and an https link', () => {
    expect(stopSchema.safeParse({ ...validStop, url: '' }).success).toBe(true);
    expect(stopSchema.safeParse({ ...validStop, url: 'https://example.com' }).success).toBe(true);
  });

  it.each([
    ['an unknown type', { type: 'spaceship' }],
    ['an empty id', { id: '' }],
    ['an empty trip id', { tripId: '' }],
    ['an impossible date', { date: '2026-02-31' }],
    ['an invalid time', { startTime: '24:00' }],
    ['a negative duration', { durationMin: -1 }],
    ['a fractional duration', { durationMin: 1.5 }],
    ['a duration over one day', { durationMin: MAX_DURATION_MINUTES + 1 }],
    ['an http link', { url: 'http://example.com' }],
    ['a javascript link', { url: 'javascript:alert(1)' }],
  ])('rejects %s', (_label, override) => {
    expect(stopSchema.safeParse({ ...validStop, ...override }).success).toBe(false);
  });

  it('accepts a duration of 0 and of exactly one day', () => {
    expect(stopSchema.safeParse({ ...validStop, durationMin: 0 }).success).toBe(true);
    expect(stopSchema.safeParse({ ...validStop, durationMin: MAX_DURATION_MINUTES }).success).toBe(true);
  });
});

describe('parseStoredStops', () => {
  it('returns null when the stored value is not a list', () => {
    for (const value of ['text', {}, 42, null, undefined]) {
      expect(parseStoredStops(value)).toBeNull();
    }
  });

  it('keeps an empty list as an empty list', () => {
    expect(parseStoredStops([])).toEqual([]);
  });

  it('drops malformed entries and keeps the valid ones', () => {
    const result = parseStoredStops([
      validStop,
      null,
      { id: 1 },
      { ...validStop, id: 'bad-time', startTime: '99:99' },
      { ...validStop, id: 'bad-link', url: 'http://a.b' },
      { ...validStop, id: 'bad-duration', durationMin: -1 },
    ]);
    expect(result?.map((stop) => stop.id)).toEqual(['stop-1']);
  });
});

describe('stop coordinates', () => {
  const { coordinates: _coordinates, ...savedBeforeCoordinatesExisted } = validStop;

  it('are optional: a stop saved before coordinates existed gets none', () => {
    const result = stopSchema.safeParse(savedBeforeCoordinatesExisted);
    expect(result.success && result.data.coordinates).toBeNull();
  });

  it('keeps stops saved before coordinates existed when reading from storage', () => {
    const stops = parseStoredStops([savedBeforeCoordinatesExisted]);
    expect(stops).toHaveLength(1);
    expect(stops?.[0]?.coordinates).toBeNull();
  });

  it('accepts a point on the map, including the edges of the range', () => {
    for (const coordinates of [
      { latitude: 38.7223, longitude: -9.1393 },
      { latitude: -90, longitude: -180 },
      { latitude: 90, longitude: 180 },
    ]) {
      expect(stopSchema.safeParse({ ...validStop, coordinates }).success).toBe(true);
    }
  });

  it.each([
    { latitude: 90.1, longitude: 0 },
    { latitude: -91, longitude: 0 },
    { latitude: 0, longitude: 180.1 },
    { latitude: 0, longitude: -181 },
    { latitude: 0 },
    { latitude: '38.7', longitude: '-9.1' },
  ])('rejects %p', (coordinates) => {
    expect(stopSchema.safeParse({ ...validStop, coordinates }).success).toBe(false);
  });
});
