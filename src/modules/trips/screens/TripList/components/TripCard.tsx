import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import type { Trip } from '../store/tripsStore';
import {
  formatDateRange,
  getDaysUntilStart,
  getTripDayCount,
  getTripStatus,
} from '../utils/tripDates';

type TripCardProps = {
  trip: Trip;
  today: Date;
  onPress: () => void;
};

export const TripCard = ({ trip, today, onPress }: TripCardProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();

  const status = getTripStatus(trip, today);
  const daysUntilStart = getDaysUntilStart(trip, today);

  // Past trips have no badge.
  let badgeLabel: string | null = null;
  if (status === 'upcoming') {
    badgeLabel = t('badge.inDays', { count: daysUntilStart });
  } else if (status === 'ongoing') {
    badgeLabel = daysUntilStart === 0 ? t('badge.today') : t('badge.ongoing');
  }

  const summary = t('summary.joined', {
    days: t('summary.days', { count: getTripDayCount(trip) }),
    stops: t('summary.stops', { count: trip.stopsCount }),
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={trip.title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <View style={styles.titleRow}>
        <Text numberOfLines={2} style={[styles.title, { color: colors.textPrimary }]}>
          {trip.title}
        </Text>
        {badgeLabel !== null && (
          <View style={[styles.badge, { backgroundColor: colors.accent }]}>
            <Text style={[styles.badgeLabel, { color: colors.onAccent }]}>{badgeLabel}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>
        {formatDateRange(trip, i18n.language)}
      </Text>
      <Text style={[styles.detail, { color: colors.textSecondary }]}>{summary}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  title: {
    flex: 1,
    ...typography.cardTitle,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeLabel: {
    ...typography.captionBold,
  },
  detail: {
    ...typography.small,
  },
});
