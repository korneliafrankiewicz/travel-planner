import type { TFunction } from 'i18next';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import type { Stop, StopType } from '../../TripList/schema/stopSchema';
import { formatTimeSpan } from '../../TripList/utils/stopTime';

const ICON_CIRCLE_SIZE = 40;
const MINUTES_PER_HOUR = 60;

const stopTypeSymbols: Record<StopType, SymbolViewProps['name']> = {
  lodging: { ios: 'bed.double.fill', android: 'hotel', web: 'hotel' },
  meal: { ios: 'fork.knife', android: 'restaurant', web: 'restaurant' },
  attraction: { ios: 'star.fill', android: 'star', web: 'star' },
  other: { ios: 'mappin.circle.fill', android: 'place', web: 'place' },
};

// "90" -> "1 h 30 min", "120" -> "2 h", "45" -> "45 min"
const formatDuration = (t: TFunction<'trips'>, totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR);
  const minutes = totalMinutes % MINUTES_PER_HOUR;
  if (hours > 0 && minutes > 0) {
    return t('stop.duration.hoursMinutes', { hours, minutes });
  }
  if (hours > 0) {
    return t('stop.duration.hours', { value: hours });
  }
  return t('stop.duration.minutes', { value: minutes });
};

type StopCardProps = {
  stop: Stop;
  // True when the stop overlaps another stop of the same day.
  overlapping: boolean;
  onPress: () => void;
};

export const StopCard = ({ stop, overlapping, onPress }: StopCardProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();

  const timeSpan = formatTimeSpan(stop, i18n.language);
  const details =
    stop.durationMin > 0 ? `${timeSpan} · ${formatDuration(t, stop.durationMin)}` : timeSpan;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${stop.title}, ${details}${overlapping ? `, ${t('itinerary.overlap')}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.surfaceSelected }]}>
        <SymbolView name={stopTypeSymbols[stop.type]} tintColor={colors.accent} size={20} />
      </View>
      <View style={styles.text}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary }]}>
          {stop.title}
        </Text>
        <Text style={[styles.details, { color: colors.textSecondary }]}>{details}</Text>
        {overlapping && (
          <Text style={[styles.warning, { color: colors.danger }]}>{t('itinerary.overlap')}</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  pressed: {
    opacity: 0.7,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    ...typography.largeMedium,
  },
  details: {
    ...typography.small,
  },
  warning: {
    ...typography.footnote,
  },
});
