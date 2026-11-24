import { screen, userEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/renderWithProviders';

import type { Stop } from '../../TripList/schema/stopSchema';
import { StopCard } from './StopCard';

const makeStop = (override: Partial<Stop> = {}): Stop => ({
  id: 'stop-1',
  tripId: 'trip-1',
  date: '2026-12-13',
  type: 'meal',
  title: 'Dinner at Time Out Market',
  startTime: '19:30',
  durationMin: 90,
  notes: '',
  url: '',
  coordinates: null,
  ...override,
});

const renderCard = (
  stop: Stop,
  options: { overlapping?: boolean; language?: 'en' | 'pl'; onPress?: () => void } = {},
) =>
  renderWithProviders(
    <StopCard stop={stop} overlapping={options.overlapping ?? false} onPress={options.onPress ?? jest.fn()} />,
    { language: options.language },
  );

// Newer ICU versions put narrow no-break spaces in times such as "7:30 PM".
const normalizeSpaces = (text: string) => text.replace(/[   ]/g, ' ');

describe('StopCard', () => {
  it('shows the title, the time span and the duration', async () => {
    await renderCard(makeStop());

    expect(screen.getByText('Dinner at Time Out Market')).toBeVisible();
    expect(normalizeSpaces(screen.getByText(/7:30/).props.children)).toBe(
      '7:30 PM – 9:00 PM · 1 h 30 min',
    );
  });

  it.each([
    [45, '45 min'],
    [60, '1 h'],
    [90, '1 h 30 min'],
    [120, '2 h'],
    [125, '2 h 5 min'],
    [1440, '24 h'],
  ])('shows a duration of %i minutes as %s', async (durationMin, expected) => {
    await renderCard(makeStop({ durationMin }));
    expect(screen.getByText(new RegExp(`· ${expected}$`))).toBeVisible();
  });

  it('shows only the start time for a stop without duration', async () => {
    await renderCard(makeStop({ durationMin: 0 }));
    expect(normalizeSpaces(screen.getByText(/7:30/).props.children)).toBe('7:30 PM');
  });

  it('shows times and durations in Polish', async () => {
    await renderCard(makeStop({ startTime: '09:00', durationMin: 90 }), { language: 'pl' });
    expect(screen.getByText('9:00 – 10:30 · 1 godz. 30 min')).toBeVisible();
  });

  describe('overlap warning', () => {
    it('is shown when the stop overlaps another one', async () => {
      await renderCard(makeStop(), { overlapping: true });
      expect(screen.getByText('Overlaps with another stop')).toBeVisible();
    });

    it('is not shown otherwise', async () => {
      await renderCard(makeStop());
      expect(screen.queryByText('Overlaps with another stop')).toBeNull();
    });

    it('is part of what a screen reader announces', async () => {
      await renderCard(makeStop(), { overlapping: true });
      expect(screen.getByRole('button', { name: /Overlaps with another stop/ })).toBeVisible();
    });

    it('is shown in Polish', async () => {
      await renderCard(makeStop(), { overlapping: true, language: 'pl' });
      expect(screen.getByText('Nakłada się na inny punkt')).toBeVisible();
    });
  });

  it('is a button that calls onPress', async () => {
    const onPress = jest.fn();
    const user = userEvent.setup();
    await renderCard(makeStop(), { onPress });

    await user.press(screen.getByRole('button', { name: /Dinner at Time Out Market/ }));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it.each(['lodging', 'meal', 'attraction', 'other'] as const)('renders a %s stop', async (type) => {
    await renderCard(makeStop({ type }));
    expect(screen.getByText('Dinner at Time Out Market')).toBeVisible();
  });
});
