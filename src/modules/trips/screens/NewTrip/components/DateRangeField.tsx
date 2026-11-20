import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, useTheme } from '@/shared/theme';

import { formatDateRange, getTripDayCount } from '../../TripList/utils/tripDates';
import { DateRangeCalendar } from './DateRangeCalendar';

type DateRangeFieldProps = {
  startDate: string | null;
  endDate: string | null;
  minDate: string;
  onSelect: (date: string) => void;
  error?: string;
};

export const DateRangeField = ({
  startDate,
  endDate,
  minDate,
  onSelect,
  error,
}: DateRangeFieldProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();

  const hasRange = startDate !== null && endDate !== null;
  const summary = hasRange
    ? formatDateRange({ startDate, endDate }, i18n.language)
    : t('form.fields.dates.hint');

  return (
    <View style={styles.field}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {t('form.fields.dates.label')}
        </Text>
        {hasRange && (
          <View style={[styles.chip, { backgroundColor: colors.accentSecondary }]}>
            <Text style={[styles.chipLabel, { color: colors.onAccentSecondary }]}>
              {t('summary.days', { count: getTripDayCount({ startDate, endDate }) })}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text>
      <DateRangeCalendar
        startDate={startDate}
        endDate={endDate}
        minDate={minDate}
        onSelect={onSelect}
      />
      {error !== undefined && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  summary: {
    fontSize: 14,
  },
  error: {
    fontSize: 13,
  },
});
