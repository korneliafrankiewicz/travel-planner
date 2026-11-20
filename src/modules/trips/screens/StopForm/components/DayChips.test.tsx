import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { DayOption } from '../hooks/useStopForm';
import { DayChips } from './DayChips';

const days: DayOption[] = [
  { date: '2026-12-13', dayNumber: 1, disabled: true },
  { date: '2026-12-14', dayNumber: 2, disabled: false },
  { date: '2026-12-15', dayNumber: 3, disabled: false },
  { date: '2026-12-20', dayNumber: null, disabled: false },
];

const renderChips = (value = '2026-12-14', language: 'en' | 'pl' = 'en') => {
  const onChange = jest.fn();
  return {
    onChange,
    ready: renderWithProviders(
      <DayChips days={days} value={value} onChange={onChange} language={language} />,
      { language },
    ),
  };
};

const chip = (name: RegExp) => screen.getByRole('radio', { name, includeHiddenElements: true });

describe('DayChips', () => {
  it('shows a chip per day with its number and short date', async () => {
    await renderChips().ready;

    expect(screen.getByText('Day 1')).toBeVisible();
    expect(screen.getByText('Day 3')).toBeVisible();
    expect(screen.getByText('Dec 14')).toBeVisible();
    expect(screen.getAllByRole('radio', { includeHiddenElements: true })).toHaveLength(4);
  });

  it('shows no day number for a day outside the trip', async () => {
    await renderChips().ready;
    expect(screen.getByText('Dec 20')).toBeVisible();
    expect(screen.queryByText('Day 4')).toBeNull();
  });

  it('shows the labels and dates in Polish', async () => {
    await renderChips('2026-12-14', 'pl').ready;
    expect(screen.getByText('Dzień 1')).toBeVisible();
    expect(screen.getByText('14 gru')).toBeVisible();
  });

  it('marks the chosen day as selected', async () => {
    await renderChips('2026-12-15').ready;
    expect(chip(/December 15, 2026/)).toBeSelected();
    expect(chip(/December 14, 2026/)).not.toBeSelected();
  });

  it('calls onChange with the date of the pressed day', async () => {
    const user = userEvent.setup();
    const { onChange, ready } = renderChips();
    await ready;

    await user.press(chip(/December 15, 2026/));

    expect(onChange).toHaveBeenCalledWith('2026-12-15');
  });

  it('cannot select a disabled day (a day in the past)', async () => {
    const user = userEvent.setup();
    const { onChange, ready } = renderChips();
    await ready;

    expect(chip(/December 13, 2026/)).toBeDisabled();
    await user.press(chip(/December 13, 2026/));
    expect(onChange).not.toHaveBeenCalled();
  });
});
