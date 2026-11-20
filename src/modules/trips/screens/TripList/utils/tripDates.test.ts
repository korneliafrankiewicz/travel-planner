import type { Trip } from '../schema/tripSchema';
import {
  addDays,
  daysBetween,
  formatDateRange,
  getDaysUntilStart,
  getTripDayCount,
  getTripDays,
  getTripStatus,
  parseLocalDate,
  startOfDay,
  toIsoDate,
} from './tripDates';

const trip = (startDate: string, endDate: string): Trip => ({
  id: 't',
  title: 'Trip',
  destination: '',
  notes: '',
  startDate,
  endDate,
});

// Newer ICU versions put thin or no-break spaces around the dash; compare with plain spaces.
const normalizeSpaces = (text: string) => text.replace(/[   ]/g, ' ');

describe('parseLocalDate / toIsoDate', () => {
  it('parses a date as local midnight', () => {
    const date = parseLocalDate('2026-12-13');
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 11, 13]);
    expect([date.getHours(), date.getMinutes()]).toEqual([0, 0]);
  });

  it('round-trips through toIsoDate', () => {
    for (const iso of ['2026-01-01', '2026-12-31', '2028-02-29', '2027-03-28']) {
      expect(toIsoDate(parseLocalDate(iso))).toBe(iso);
    }
  });

  it('pads month and day with zeros', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('daysBetween', () => {
  it('counts whole calendar days', () => {
    expect(daysBetween(new Date(2026, 10, 20), new Date(2026, 11, 13))).toBe(23);
    expect(daysBetween(new Date(2026, 11, 13), new Date(2026, 10, 20))).toBe(-23);
    expect(daysBetween(new Date(2026, 10, 20), new Date(2026, 10, 20))).toBe(0);
  });

  it('ignores the time of day', () => {
    expect(daysBetween(new Date(2026, 10, 20, 23, 59), new Date(2026, 10, 21, 0, 1))).toBe(1);
  });

  it('is not skewed by daylight saving changes', () => {
    // The clocks change in Poland on 2027-03-28 (spring) and 2026-10-25 (autumn).
    expect(daysBetween(parseLocalDate('2027-03-27'), parseLocalDate('2027-03-29'))).toBe(2);
    expect(daysBetween(parseLocalDate('2026-10-24'), parseLocalDate('2026-10-26'))).toBe(2);
  });
});

describe('startOfDay / addDays', () => {
  it('drops the time', () => {
    const date = startOfDay(new Date(2026, 5, 10, 17, 45, 12));
    expect([date.getHours(), date.getMinutes(), date.getSeconds()]).toEqual([0, 0, 0]);
  });

  it('adds days across month and year boundaries', () => {
    expect(toIsoDate(addDays(parseLocalDate('2026-12-30'), 3))).toBe('2027-01-02');
    expect(toIsoDate(addDays(parseLocalDate('2026-03-01'), -1))).toBe('2026-02-28');
  });
});

describe('getTripDayCount / getTripDays', () => {
  it('counts both the first and the last day', () => {
    expect(getTripDayCount(trip('2026-12-13', '2026-12-15'))).toBe(3);
    expect(getTripDayCount(trip('2026-12-13', '2026-12-13'))).toBe(1);
  });

  it('lists every day of the trip', () => {
    expect(getTripDays(trip('2026-12-13', '2026-12-15'))).toEqual([
      '2026-12-13',
      '2026-12-14',
      '2026-12-15',
    ]);
  });

  it('crosses month and year boundaries', () => {
    expect(getTripDays(trip('2026-12-30', '2027-01-02'))).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ]);
  });

  it('neither skips nor repeats a day when the clocks change', () => {
    expect(getTripDays(trip('2027-03-27', '2027-03-29'))).toEqual([
      '2027-03-27',
      '2027-03-28',
      '2027-03-29',
    ]);
    expect(getTripDays(trip('2026-10-24', '2026-10-26'))).toEqual([
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
    ]);
  });

  it('handles a leap day', () => {
    expect(getTripDays(trip('2028-02-28', '2028-03-01'))).toEqual([
      '2028-02-28',
      '2028-02-29',
      '2028-03-01',
    ]);
  });
});

describe('getDaysUntilStart / getTripStatus', () => {
  const today = new Date(2026, 10, 20, 15, 30);

  it('counts the days until the trip starts', () => {
    expect(getDaysUntilStart(trip('2026-12-13', '2026-12-15'), today)).toBe(23);
    expect(getDaysUntilStart(trip('2026-11-20', '2026-11-22'), today)).toBe(0);
  });

  it('is upcoming before the first day', () => {
    expect(getTripStatus(trip('2026-11-21', '2026-11-25'), today)).toBe('upcoming');
  });

  it('is ongoing from the first to the last day, inclusive', () => {
    expect(getTripStatus(trip('2026-11-20', '2026-11-25'), today)).toBe('ongoing');
    expect(getTripStatus(trip('2026-11-10', '2026-11-20'), today)).toBe('ongoing');
    expect(getTripStatus(trip('2026-11-18', '2026-11-22'), today)).toBe('ongoing');
  });

  it('is past after the last day', () => {
    expect(getTripStatus(trip('2026-11-10', '2026-11-19'), today)).toBe('past');
  });
});

describe('formatDateRange', () => {
  const range = trip('2026-12-13', '2026-12-15');

  it('formats the range in English', () => {
    expect(normalizeSpaces(formatDateRange(range, 'en'))).toBe('Dec 13 – 15, 2026');
  });

  it('formats the range in Polish', () => {
    expect(formatDateRange(range, 'pl')).toBe('13–15 gru 2026');
  });

  it('shows both years when the range spans two years', () => {
    const text = normalizeSpaces(formatDateRange(trip('2026-12-30', '2027-01-02'), 'en'));
    expect(text).toContain('2026');
    expect(text).toContain('2027');
  });

  describe('without Intl range formatting', () => {
    const original = Object.getOwnPropertyDescriptor(Intl.DateTimeFormat.prototype, 'formatRange');

    beforeEach(() => {
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'formatRange', {
        value: undefined,
        configurable: true,
      });
    });

    afterEach(() => {
      if (original !== undefined) {
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'formatRange', original);
      }
    });

    it('falls back to formatting both ends separately', () => {
      expect(normalizeSpaces(formatDateRange(range, 'en'))).toBe('Dec 13 – Dec 15, 2026');
    });
  });
});
