import { createIsoDateSchema, parseStoredTrips, tripSchema } from './tripSchema';

const validTrip = {
  id: 'trip-1',
  title: 'Lisbon city break',
  destination: 'Lisbon, Portugal',
  notes: '',
  startDate: '2026-12-13',
  endDate: '2026-12-15',
};

describe('createIsoDateSchema', () => {
  const schema = createIsoDateSchema('custom.error');

  it.each(['2026-12-13', '2026-01-01', '2028-02-29', '2026-12-31'])('accepts %s', (value) => {
    expect(schema.safeParse(value).success).toBe(true);
  });

  it.each([
    ['an impossible day', '2026-02-31'],
    ['a day that is not in a non-leap February', '2026-02-29'],
    ['month 13', '2026-13-01'],
    ['month 0', '2026-00-10'],
    ['day order reversed', '13-12-2026'],
    ['missing zero padding', '2026-1-1'],
    ['an empty string', ''],
    ['a word', 'tomorrow'],
    ['a date with a time', '2026-12-13T10:00'],
  ])('rejects %s', (_label, value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  it.each([null, undefined, 20261213, {}])('rejects the non-string %p', (value) => {
    expect(schema.safeParse(value).success).toBe(false);
  });

  it('reports the custom error message for every kind of failure', () => {
    for (const value of ['2026-02-31', 'tomorrow', null, undefined]) {
      const result = schema.safeParse(value);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('custom.error');
      }
    }
  });
});

describe('tripSchema', () => {
  it('accepts a valid trip', () => {
    expect(tripSchema.safeParse(validTrip).success).toBe(true);
  });

  it('accepts a one-day trip', () => {
    expect(tripSchema.safeParse({ ...validTrip, endDate: validTrip.startDate }).success).toBe(true);
  });

  it('accepts a trip in the past (it was planned in advance, then ended)', () => {
    expect(
      tripSchema.safeParse({ ...validTrip, startDate: '2020-01-01', endDate: '2020-01-05' }).success,
    ).toBe(true);
  });

  it('rejects an end date before the start date', () => {
    expect(tripSchema.safeParse({ ...validTrip, endDate: '2026-12-12' }).success).toBe(false);
  });

  it('rejects an empty id', () => {
    expect(tripSchema.safeParse({ ...validTrip, id: '' }).success).toBe(false);
  });

  it('rejects a missing field', () => {
    const { title: _title, ...withoutTitle } = validTrip;
    expect(tripSchema.safeParse(withoutTitle).success).toBe(false);
  });

  it('drops fields it does not know, such as the old stopsCount', () => {
    const result = tripSchema.safeParse({ ...validTrip, stopsCount: 7 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty('stopsCount');
    }
  });
});

describe('parseStoredTrips', () => {
  it('returns null when the stored value is not a list', () => {
    for (const value of ['text', {}, 42, null, undefined]) {
      expect(parseStoredTrips(value)).toBeNull();
    }
  });

  it('keeps an empty list as an empty list', () => {
    expect(parseStoredTrips([])).toEqual([]);
  });

  it('keeps valid trips in order', () => {
    const second = { ...validTrip, id: 'trip-2' };
    expect(parseStoredTrips([validTrip, second])).toEqual([validTrip, second]);
  });

  it('drops malformed entries and keeps the valid ones', () => {
    const result = parseStoredTrips([
      validTrip,
      null,
      { id: 5 },
      { ...validTrip, id: 'bad-date', startDate: 'tomorrow' },
      { ...validTrip, id: 'backwards', endDate: '2020-01-01' },
    ]);
    expect(result?.map((trip) => trip.id)).toEqual(['trip-1']);
  });
});
