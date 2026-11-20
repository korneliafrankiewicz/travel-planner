import type { Stop } from '../schema/stopSchema';

const MINUTES_PER_HOUR = 60;

// "09:30" -> 570
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * MINUTES_PER_HOUR + minutes;
};

export const getStopEndMinutes = (stop: Pick<Stop, 'startTime' | 'durationMin'>): number =>
  timeToMinutes(stop.startTime) + stop.durationMin;

// Formats a clock time for display using the given language, e.g. "9:30 AM" (en) or "09:30" (pl).
export const formatClock = (totalMinutes: number, language: string): string => {
  const date = new Date(
    2000,
    0,
    1,
    Math.floor(totalMinutes / MINUTES_PER_HOUR) % 24,
    totalMinutes % MINUTES_PER_HOUR,
  );
  return new Intl.DateTimeFormat(language, { hour: 'numeric', minute: '2-digit' }).format(date);
};

// Display text for the time span of a stop, e.g. "9:00 AM – 10:30 AM", or just the start
// time when the stop has no duration.
export const formatTimeSpan = (
  stop: Pick<Stop, 'startTime' | 'durationMin'>,
  language: string,
): string => {
  const start = formatClock(timeToMinutes(stop.startTime), language);
  if (stop.durationMin === 0) {
    return start;
  }
  return `${start} – ${formatClock(getStopEndMinutes(stop), language)}`;
};
