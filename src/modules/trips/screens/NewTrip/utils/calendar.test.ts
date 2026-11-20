import { addMonths, getMonthGrid, selectDateInRange, startOfMonth } from './calendar';

describe('startOfMonth / addMonths', () => {
  it('goes to the first day of the month', () => {
    const date = startOfMonth(new Date(2026, 11, 17, 15, 30));
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 11, 1]);
  });

  it('adds months, wrapping the year in both directions', () => {
    const forward = addMonths(new Date(2026, 11, 1), 1);
    expect([forward.getFullYear(), forward.getMonth()]).toEqual([2027, 0]);
    const backward = addMonths(new Date(2027, 0, 1), -1);
    expect([backward.getFullYear(), backward.getMonth()]).toEqual([2026, 11]);
  });

  it('never skips a short month', () => {
    // Adding a month to the 31st of January must land in February, not March.
    const result = addMonths(startOfMonth(new Date(2026, 0, 31)), 1);
    expect(result.getMonth()).toBe(1);
  });
});

describe('getMonthGrid', () => {
  it('starts weeks on Monday (December 2026 starts on a Tuesday)', () => {
    const grid = getMonthGrid(new Date(2026, 11, 1));
    expect(grid[0]).toEqual([null, 1, 2, 3, 4, 5, 6]);
    expect(grid[grid.length - 1]).toEqual([28, 29, 30, 31, null, null, null]);
    expect(grid).toHaveLength(5);
  });

  it('pads with six blanks when the month starts on a Sunday (February 2026)', () => {
    const grid = getMonthGrid(new Date(2026, 1, 1));
    expect(grid[0]).toEqual([null, null, null, null, null, null, 1]);
  });

  it('needs six rows when the month starts late in the week (August 2026)', () => {
    expect(getMonthGrid(new Date(2026, 7, 1))).toHaveLength(6);
  });

  it('knows the length of every month, including a leap February', () => {
    const days = (month: Date) => getMonthGrid(month).flat().filter((cell) => cell !== null).length;
    expect(days(new Date(2026, 1, 1))).toBe(28);
    expect(days(new Date(2028, 1, 1))).toBe(29);
    expect(days(new Date(2026, 3, 1))).toBe(30);
    expect(days(new Date(2026, 11, 1))).toBe(31);
  });

  it('always returns full weeks of 7 cells with the days in order', () => {
    for (let month = 0; month < 12; month++) {
      const grid = getMonthGrid(new Date(2026, month, 1));
      expect(grid.every((week) => week.length === 7)).toBe(true);
      const days = grid.flat().filter((cell): cell is number => cell !== null);
      expect(days).toEqual(Array.from({ length: days.length }, (_, index) => index + 1));
    }
  });
});

describe('selectDateInRange', () => {
  const empty = { startDate: null, endDate: null };

  it('the first tap sets the start', () => {
    expect(selectDateInRange(empty, '2026-12-13')).toEqual({
      startDate: '2026-12-13',
      endDate: null,
    });
  });

  it('the second tap, on or after the start, sets the end', () => {
    expect(selectDateInRange({ startDate: '2026-12-13', endDate: null }, '2026-12-15')).toEqual({
      startDate: '2026-12-13',
      endDate: '2026-12-15',
    });
  });

  it('tapping the same day twice selects a one-day trip', () => {
    expect(selectDateInRange({ startDate: '2026-12-13', endDate: null }, '2026-12-13')).toEqual({
      startDate: '2026-12-13',
      endDate: '2026-12-13',
    });
  });

  it('a tap before the start restarts the range from that day', () => {
    expect(selectDateInRange({ startDate: '2026-12-13', endDate: null }, '2026-12-10')).toEqual({
      startDate: '2026-12-10',
      endDate: null,
    });
  });

  it('a tap after a complete range starts a new range', () => {
    expect(
      selectDateInRange({ startDate: '2026-12-13', endDate: '2026-12-15' }, '2026-12-20'),
    ).toEqual({ startDate: '2026-12-20', endDate: null });
  });

  it('does not change its input', () => {
    const current = { startDate: '2026-12-13', endDate: null };
    selectDateInRange(current, '2026-12-15');
    expect(current).toEqual({ startDate: '2026-12-13', endDate: null });
  });
});
