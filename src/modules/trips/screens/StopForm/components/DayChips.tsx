import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import { parseLocalDate } from '../../TripList/utils/tripDates';
import type { DayOption } from '../hooks/useStopForm';

const DISABLED_OPACITY = 0.35;

type DayChipsProps = {
  days: DayOption[];
  value: string;
  onChange: (date: string) => void;
  language: string;
};

// Horizontal list of the trip's days to pick from. Days in the past are disabled.
export const DayChips = ({ days, value, onChange, language }: DayChipsProps) => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();

  const shortDate = new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short' });
  const fullDate = new Intl.DateTimeFormat(language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.row}>
      {days.map((day) => {
        const selected = day.date === value;
        const date = parseLocalDate(day.date);
        const textColor = selected ? colors.onAccent : colors.textPrimary;
        const mutedColor = selected ? colors.onAccent : colors.textSecondary;

        return (
          <Pressable
            key={day.date}
            accessibilityRole="radio"
            accessibilityLabel={fullDate.format(date)}
            accessibilityState={{ selected, disabled: day.disabled }}
            disabled={day.disabled}
            onPress={() => onChange(day.date)}
            style={[
              styles.chip,
              {
                backgroundColor: selected ? colors.accent : colors.surface,
                borderColor: selected ? colors.accent : colors.border,
              },
              day.disabled && styles.disabled,
            ]}>
            {day.dayNumber !== null && (
              <Text style={[styles.dayLabel, { color: mutedColor }]}>
                {t('itinerary.day', { number: day.dayNumber })}
              </Text>
            )}
            <Text style={[styles.date, { color: textColor }]}>{shortDate.format(date)}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    gap: spacing.sm,
  },
  chip: {
    minWidth: 72,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
  dayLabel: {
    ...typography.captionSemibold,
  },
  date: {
    ...typography.smallSemibold,
  },
});
