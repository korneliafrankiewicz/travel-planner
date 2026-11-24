import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing, typography, useTheme } from '@/shared/theme';

import type { Stop } from '../../TripList/schema/stopSchema';
import { formatDistance } from '../utils/formatDistance';
import { buildDayRoute } from '../utils/route';
import { DayRouteMap } from './DayRouteMap';

type DayRouteProps = {
  // The stops of one day, in the order of the day.
  stops: Stop[];
};

// Under a day: its stops with a place, joined in order on a map with the distances. It starts
// closed, because every open map is a native view and a trip can have many days.
// Shows nothing unless at least two stops of the day have a place.
export const DayRoute = ({ stops }: DayRouteProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);

  const route = buildDayRoute(stops);
  if (route === null) {
    return null;
  }

  const distanceLabels = route.legs.map((leg) =>
    formatDistance(t, leg.distanceMeters, i18n.language),
  );
  const summary = t('itinerary.route.summary', {
    stops: t('summary.stops', { count: route.points.length }),
    distance: formatDistance(t, route.totalMeters, i18n.language),
  });

  return (
    <View style={[styles.container, { borderTopColor: colors.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={`${open ? t('itinerary.route.hide') : t('itinerary.route.show')}, ${summary}`}
        onPress={() => setOpen((current) => !current)}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
        <SymbolView
          tintColor={colors.accent}
          name={{ ios: 'point.topleft.down.to.point.bottomright.curvepath', android: 'route', web: 'route' }}
          size={20}
        />
        <View style={styles.toggleText}>
          <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>
            {open ? t('itinerary.route.hide') : t('itinerary.route.show')}
          </Text>
          <Text style={[styles.summary, { color: colors.textSecondary }]}>{summary}</Text>
        </View>
        <SymbolView
          tintColor={colors.textSecondary}
          name={
            open
              ? { ios: 'chevron.up', android: 'expand_less', web: 'expand_less' }
              : { ios: 'chevron.down', android: 'expand_more', web: 'expand_more' }
          }
          size={16}
        />
      </Pressable>

      {open && (
        <View style={styles.details}>
          {Platform.OS !== 'web' && <DayRouteMap route={route} distanceLabels={distanceLabels} />}

          <View style={styles.legs}>
            {route.legs.map((leg, index) => (
              <View
                key={`${leg.from.stopId}-${leg.to.stopId}`}
                accessible
                accessibilityLabel={t('itinerary.route.legAccessible', {
                  from: leg.from.title,
                  to: leg.to.title,
                  distance: distanceLabels[index],
                })}
                style={styles.leg}>
                <Text numberOfLines={2} style={[styles.legTitle, { color: colors.textPrimary }]}>
                  {t('itinerary.route.leg', {
                    fromOrder: leg.from.order,
                    from: leg.from.title,
                    toOrder: leg.to.order,
                    to: leg.to.title,
                  })}
                </Text>
                <Text style={[styles.legDistance, { color: colors.textSecondary }]}>
                  {distanceLabels[index]}
                </Text>
              </View>
            ))}
          </View>

          <Text style={[styles.note, { color: colors.textSecondary }]}>
            {t('itinerary.route.straightLine')}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  toggleText: {
    flex: 1,
    gap: spacing.xs,
  },
  toggleLabel: {
    ...typography.largeMedium,
  },
  summary: {
    ...typography.small,
  },
  details: {
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  legs: {
    gap: spacing.sm,
  },
  leg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  legTitle: {
    ...typography.small,
    flex: 1,
  },
  legDistance: {
    ...typography.smallSemibold,
  },
  note: {
    ...typography.footnote,
  },
});
