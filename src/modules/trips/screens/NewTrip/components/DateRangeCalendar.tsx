import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { fontWeight, radius, spacing, typography, useTheme } from '@/shared/theme';

import { parseLocalDate, toIsoDate } from '../../TripList/utils/tripDates';
import { addMonths, getMonthGrid, startOfMonth } from '../utils/calendar';

const DAY_CELL_HEIGHT = 40;
const DAYS_IN_WEEK = 7;
// 1 January 2024 was a Monday, used to get localized weekday names starting on Monday.
const MONDAY_REFERENCE = new Date(2024, 0, 1);

type DateRangeCalendarProps = {
  startDate: string | null;
  endDate: string | null;
  // First day that can be selected (YYYY-MM-DD). Earlier days are disabled.
  minDate: string;
  onSelect: (date: string) => void;
};

export const DateRangeCalendar = ({
  startDate,
  endDate,
  minDate,
  onSelect,
}: DateRangeCalendarProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(startDate !== null ? parseLocalDate(startDate) : new Date()),
  );

  // Going back stops at the month of `minDate`, or at an already selected earlier start date
  // (a trip that has already started can still be shown in full when editing it).
  const earliestMonth = startOfMonth(
    parseLocalDate(startDate !== null && startDate < minDate ? startDate : minDate),
  );
  const canGoToPreviousMonth = visibleMonth.getTime() > earliestMonth.getTime();

  const monthLabel = new Intl.DateTimeFormat(i18n.language, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);
  const weekdayFormat = new Intl.DateTimeFormat(i18n.language, { weekday: 'narrow' });
  const fullDateFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const weekdayLabels = Array.from({ length: DAYS_IN_WEEK }, (_, index) =>
    weekdayFormat.format(new Date(2024, 0, MONDAY_REFERENCE.getDate() + index)),
  );
  const weeks = getMonthGrid(visibleMonth);
  const todayIso = toIsoDate(new Date());

  return (
    <View style={[styles.calendar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.monthRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.calendar.previousMonth')}
          accessibilityState={{ disabled: !canGoToPreviousMonth }}
          disabled={!canGoToPreviousMonth}
          hitSlop={spacing.md}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          style={!canGoToPreviousMonth && styles.disabledControl}>
          <SymbolView
            tintColor={colors.textPrimary}
            name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
            size={20}
          />
        </Pressable>
        <Text
          accessibilityRole="header"
          style={[styles.monthLabel, { color: colors.textPrimary }]}>
          {monthLabel}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.calendar.nextMonth')}
          hitSlop={spacing.md}
          onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}>
          <SymbolView
            tintColor={colors.textPrimary}
            name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
            size={20}
          />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {weekdayLabels.map((label, index) => (
          <Text
            key={index}
            importantForAccessibility="no"
            style={[styles.weekdayLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>

      {weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {week.map((day, dayIndex) => {
            if (day === null) {
              return <View key={dayIndex} style={styles.dayCell} />;
            }

            const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
            const iso = toIsoDate(date);
            const isEdge = iso === startDate || iso === endDate;
            const isBetween =
              startDate !== null && endDate !== null && iso > startDate && iso < endDate;
            const isToday = iso === todayIso;
            const isDisabled = iso < minDate;

            return (
              <Pressable
                key={dayIndex}
                accessibilityRole="button"
                accessibilityLabel={fullDateFormat.format(date)}
                accessibilityState={{ selected: isEdge || isBetween, disabled: isDisabled }}
                disabled={isDisabled}
                onPress={() => onSelect(iso)}
                style={[
                  styles.dayCell,
                  isBetween && { backgroundColor: colors.accentSecondary },
                ]}>
                <View style={[styles.dayCircle, isEdge && { backgroundColor: colors.accent }]}>
                  <Text
                    style={[
                      styles.dayLabel,
                      isToday && styles.todayLabel,
                      isDisabled && !isEdge && !isBetween && styles.disabledLabel,
                      {
                        color: isEdge
                          ? colors.onAccent
                          : isBetween
                            ? colors.onAccentSecondary
                            : colors.textPrimary,
                      },
                    ]}>
                    {day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  calendar: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  monthLabel: {
    ...typography.largeBold,
    textTransform: 'capitalize',
  },
  weekRow: {
    flexDirection: 'row',
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...typography.captionSemibold,
    paddingVertical: spacing.xs,
  },
  dayCell: {
    flex: 1,
    height: DAY_CELL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    width: DAY_CELL_HEIGHT - 4,
    height: DAY_CELL_HEIGHT - 4,
    borderRadius: (DAY_CELL_HEIGHT - 4) / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayLabel: {
    ...typography.bodyMedium,
  },
  disabledLabel: {
    opacity: 0.35,
  },
  disabledControl: {
    opacity: 0.35,
  },
  todayLabel: {
    fontWeight: fontWeight.heavy,
    textDecorationLine: 'underline',
  },
});
