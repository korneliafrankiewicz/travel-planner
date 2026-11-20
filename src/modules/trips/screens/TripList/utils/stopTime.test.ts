import { formatClock, formatTimeSpan, getStopEndMinutes, timeToMinutes } from './stopTime';

// Newer ICU versions put narrow no-break spaces in times such as "9:30 AM".
const normalizeSpaces = (text: string) => text.replace(/[   ]/g, ' ');

describe('timeToMinutes', () => {
  it('converts HH:mm to minutes since midnight', () => {
    expect(timeToMinutes('00:00')).toBe(0);
    expect(timeToMinutes('00:01')).toBe(1);
    expect(timeToMinutes('09:30')).toBe(570);
    expect(timeToMinutes('12:00')).toBe(720);
    expect(timeToMinutes('23:59')).toBe(1439);
  });
});

describe('getStopEndMinutes', () => {
  it('is the start plus the duration', () => {
    expect(getStopEndMinutes({ startTime: '09:00', durationMin: 90 })).toBe(630);
  });

  it('is the start for a stop without duration', () => {
    expect(getStopEndMinutes({ startTime: '09:00', durationMin: 0 })).toBe(540);
  });

  it('can reach midnight exactly', () => {
    expect(getStopEndMinutes({ startTime: '23:00', durationMin: 60 })).toBe(1440);
  });
});

describe('formatClock', () => {
  it('uses a 12-hour clock in English', () => {
    expect(normalizeSpaces(formatClock(570, 'en'))).toBe('9:30 AM');
    expect(normalizeSpaces(formatClock(15 * 60, 'en'))).toBe('3:00 PM');
  });

  it('uses a 24-hour clock in Polish', () => {
    expect(formatClock(570, 'pl')).toBe('9:30');
    expect(formatClock(15 * 60, 'pl')).toBe('15:00');
  });

  it('wraps past midnight instead of showing hour 24', () => {
    expect(formatClock(1440, 'pl')).not.toContain('24');
  });
});

describe('formatTimeSpan', () => {
  it('shows the start and the end', () => {
    expect(formatTimeSpan({ startTime: '09:00', durationMin: 90 }, 'pl')).toBe('9:00 – 10:30');
    expect(normalizeSpaces(formatTimeSpan({ startTime: '09:00', durationMin: 90 }, 'en'))).toBe(
      '9:00 AM – 10:30 AM',
    );
  });

  it('shows only the start for a stop without duration', () => {
    const text = formatTimeSpan({ startTime: '09:00', durationMin: 0 }, 'pl');
    expect(text).toBe('9:00');
    expect(text).not.toContain('–');
  });
});
