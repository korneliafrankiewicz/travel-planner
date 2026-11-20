export type DateSelection = {
  startDate: string | null;
  endDate: string | null;
};

export const startOfMonth = (date: Date): Date => new Date(date.getFullYear(), date.getMonth(), 1);

export const addMonths = (date: Date, months: number): Date =>
  new Date(date.getFullYear(), date.getMonth() + months, 1);

// Builds the weeks of a month as rows of 7 cells, Monday first.
// A cell is the day of the month, or null for the padding before and after the month.
export const getMonthGrid = (month: Date): (number | null)[][] => {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const leadingBlanks = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  const cells: (number | null)[] = [
    ...Array<null>(leadingBlanks).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const weeks: (number | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
};

// Range selection by tapping: first tap sets the start, second tap sets the end.
// Tapping the same day twice selects a one-day trip. A tap before the start restarts the range.
export const selectDateInRange = (current: DateSelection, tapped: string): DateSelection => {
  const { startDate, endDate } = current;

  if (startDate === null || endDate !== null || tapped < startDate) {
    return { startDate: tapped, endDate: null };
  }
  return { startDate, endDate: tapped };
};
