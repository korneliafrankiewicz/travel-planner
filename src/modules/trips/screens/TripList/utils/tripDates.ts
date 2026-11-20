import type { Trip } from '../store/tripsStore';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type TripStatus = 'upcoming' | 'ongoing' | 'past';

export type DateRange = Pick<Trip, 'startDate' | 'endDate'>;

// Parses a YYYY-MM-DD string as a local calendar date (midnight, local time).
export const parseLocalDate = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Formats a local date as YYYY-MM-DD (the inverse of `parseLocalDate`).
export const toIsoDate = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

// Whole calendar days from `from` to `to`. Rounded so daylight saving changes do not skew it.
export const daysBetween = (from: Date, to: Date): number =>
  Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / MS_PER_DAY);

// Number of calendar days the trip covers, counting both the first and the last day.
export const getTripDayCount = (trip: DateRange): number =>
  daysBetween(parseLocalDate(trip.startDate), parseLocalDate(trip.endDate)) + 1;

export const addDays = (date: Date, days: number): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);

// Every calendar day of the trip as YYYY-MM-DD, from the first to the last day.
export const getTripDays = (trip: DateRange): string[] => {
  const start = parseLocalDate(trip.startDate);
  return Array.from({ length: getTripDayCount(trip) }, (_, index) =>
    toIsoDate(addDays(start, index)),
  );
};

export const getDaysUntilStart = (trip: Trip, today: Date): number =>
  daysBetween(today, parseLocalDate(trip.startDate));

export const getTripStatus = (trip: Trip, today: Date): TripStatus => {
  if (daysBetween(today, parseLocalDate(trip.startDate)) > 0) {
    return 'upcoming';
  }
  if (daysBetween(today, parseLocalDate(trip.endDate)) < 0) {
    return 'past';
  }
  return 'ongoing';
};

// Formats e.g. "13–15 Dec 2026" (en) or "13–15 gru 2026" (pl) using the given language.
export const formatDateRange = (trip: DateRange, language: string): string => {
  const start = parseLocalDate(trip.startDate);
  const end = parseLocalDate(trip.endDate);
  const withYear = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  try {
    if (typeof withYear.formatRange === 'function') {
      return withYear.formatRange(start, end);
    }
  } catch {
    // Fall through to the manual formatting below.
  }

  // Fallback for runtimes without `Intl.DateTimeFormat.prototype.formatRange`.
  const withoutYear = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' });
  return start.getFullYear() === end.getFullYear()
    ? `${withoutYear.format(start)} – ${withYear.format(end)}`
    : `${withYear.format(start)} – ${withYear.format(end)}`;
};
