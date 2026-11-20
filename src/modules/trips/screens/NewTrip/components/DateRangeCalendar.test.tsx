import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import { DateRangeCalendar } from './DateRangeCalendar';

type Props = Partial<React.ComponentProps<typeof DateRangeCalendar>>;

const renderCalendar = (props: Props = {}, language: 'en' | 'pl' = 'en') => {
  const onSelect = jest.fn();
  return {
    onSelect,
    ready: renderWithProviders(
      <DateRangeCalendar
        startDate="2026-11-25"
        endDate={null}
        minDate="2026-11-20"
        onSelect={onSelect}
        {...props}
      />,
      { language },
    ),
  };
};

// Days are buttons named with their full date, e.g. "Friday, November 20, 2026".
const day = (month: string, dayOfMonth: number, year = 2026) =>
  screen.getByRole('button', {
    name: new RegExp(`${month} ${dayOfMonth}, ${year}$`),
    includeHiddenElements: true,
  });

describe('DateRangeCalendar', () => {
  it('shows the month of the selected start date, with the weekdays starting on Monday', async () => {
    await renderCalendar().ready;

    expect(screen.getByText('November 2026')).toBeVisible();
    expect(screen.getAllByText(/^[MTWFS]$/)).toHaveLength(7);
  });

  it('shows the month name in Polish', async () => {
    await renderCalendar({}, 'pl').ready;
    expect(screen.getByText('listopad 2026')).toBeVisible();
  });

  describe('days before minDate (the past)', () => {
    it('are disabled and cannot be selected', async () => {
      const user = userEvent.setup();
      const { onSelect, ready } = renderCalendar();
      await ready;

      expect(day('November', 19)).toBeDisabled();
      await user.press(day('November', 19));
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('include every earlier day of the month', async () => {
      await renderCalendar().ready;
      for (let dayOfMonth = 1; dayOfMonth < 20; dayOfMonth++) {
        expect(day('November', dayOfMonth)).toBeDisabled();
      }
    });
  });

  describe('minDate and later', () => {
    it('can be selected, starting with minDate itself (today)', async () => {
      const user = userEvent.setup();
      const { onSelect, ready } = renderCalendar();
      await ready;

      await user.press(day('November', 20));
      await user.press(day('November', 28));

      expect(onSelect).toHaveBeenNthCalledWith(1, '2026-11-20');
      expect(onSelect).toHaveBeenNthCalledWith(2, '2026-11-28');
    });

    it('are enabled', async () => {
      await renderCalendar().ready;
      expect(day('November', 20)).toBeEnabled();
      expect(day('November', 30)).toBeEnabled();
    });
  });

  describe('month navigation', () => {
    it('cannot go back before the current month', async () => {
      const user = userEvent.setup();
      await renderCalendar().ready;

      const previous = screen.getByRole('button', { name: 'Previous month' });
      expect(previous).toBeDisabled();
      await user.press(previous);
      expect(screen.getByText('November 2026')).toBeVisible();
    });

    it('goes forward, and back again once there is a month to go back to', async () => {
      const user = userEvent.setup();
      await renderCalendar().ready;

      await user.press(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByText('December 2026')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Previous month' })).toBeEnabled();
      expect(day('December', 1)).toBeEnabled();

      await user.press(screen.getByRole('button', { name: 'Previous month' }));
      expect(screen.getByText('November 2026')).toBeVisible();
    });

    it('goes across the new year', async () => {
      const user = userEvent.setup();
      await renderCalendar({ startDate: '2026-12-10', minDate: '2026-11-20' }).ready;

      await user.press(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByText('January 2027')).toBeVisible();
    });

    it('lets a trip that already started show its earlier start month (editing)', async () => {
      const user = userEvent.setup();
      // The trip started in October; today is 20 November.
      await renderCalendar({ startDate: '2026-10-05', endDate: '2026-10-08' }).ready;

      expect(screen.getByText('October 2026')).toBeVisible();
      expect(screen.getByRole('button', { name: 'Previous month' })).toBeDisabled();
      await user.press(screen.getByRole('button', { name: 'Next month' }));
      expect(screen.getByText('November 2026')).toBeVisible();
    });
  });

  describe('selected range', () => {
    it('marks the start, the end and every day between as selected', async () => {
      await renderCalendar({ startDate: '2026-11-25', endDate: '2026-11-27' }).ready;

      for (const dayOfMonth of [25, 26, 27]) {
        expect(day('November', dayOfMonth)).toBeSelected();
      }
      expect(day('November', 24)).not.toBeSelected();
      expect(day('November', 28)).not.toBeSelected();
    });

    it('marks only the start when there is no end yet', async () => {
      await renderCalendar({ startDate: '2026-11-25', endDate: null }).ready;

      expect(day('November', 25)).toBeSelected();
      expect(day('November', 26)).not.toBeSelected();
    });

    it('keeps an earlier, already-started range selected even though its days are disabled', async () => {
      await renderCalendar({ startDate: '2026-10-05', endDate: '2026-10-07' }).ready;

      expect(day('October', 5)).toBeSelected();
      expect(day('October', 5)).toBeDisabled();
    });
  });
});
