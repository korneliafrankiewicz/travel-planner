import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Fragment } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import { useStopsStore } from '../../TripList/store/stopsStore';
import type { Trip } from '../../TripList/store/tripsStore';
import { parseLocalDate, toIsoDate } from '../../TripList/utils/tripDates';
import { buildItinerary, findOverlappingStopIds } from '../utils/itinerary';
import { StopCard } from './StopCard';

const ADD_BUTTON_SIZE = 36;

type ItinerarySectionProps = {
  trip: Trip;
};

// The trip day by day, with the stops planned for each day.
export const ItinerarySection = ({ trip }: ItinerarySectionProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();
  const router = useRouter();
  const allStops = useStopsStore((state) => state.stops);

  const tripStops = allStops.filter((stop) => stop.tripId === trip.id);
  const days = buildItinerary(trip, tripStops);
  const today = toIsoDate(new Date());
  const dateFormat = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t('itinerary.title')}
      </Text>

      {days.map((day) => {
        // Stops can only be planned for today or later, and only on days of the trip.
        const canAddStop = day.dayNumber !== null && day.date >= today;
        const overlapping = findOverlappingStopIds(day.stops);

        return (
          <View
            key={day.date}
            style={[styles.day, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.dayHeader}>
              <View style={styles.dayTitles}>
                <Text accessibilityRole="header" style={[styles.dayTitle, { color: colors.textPrimary }]}>
                  {day.dayNumber !== null
                    ? t('itinerary.day', { number: day.dayNumber })
                    : t('itinerary.outsideTrip')}
                </Text>
                <Text style={[styles.dayDate, { color: colors.textSecondary }]}>
                  {dateFormat.format(parseLocalDate(day.date))}
                </Text>
              </View>
              {canAddStop && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${t('itinerary.addStop')}, ${dateFormat.format(parseLocalDate(day.date))}`}
                  onPress={() =>
                    router.push({
                      pathname: '/trip/[id]/stops/new',
                      params: { id: trip.id, date: day.date },
                    })
                  }
                  style={({ pressed }) => [
                    styles.addButton,
                    { backgroundColor: colors.accentSecondary },
                    pressed && styles.pressed,
                  ]}>
                  <SymbolView
                    tintColor={colors.onAccentSecondary}
                    name={{ ios: 'plus', android: 'add', web: 'add' }}
                    size={18}
                  />
                </Pressable>
              )}
            </View>

            {day.stops.length === 0 ? (
              <Text style={[styles.empty, { color: colors.textSecondary }]}>
                {t('itinerary.empty')}
              </Text>
            ) : (
              day.stops.map((stop) => (
                <Fragment key={stop.id}>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <StopCard
                    stop={stop}
                    overlapping={overlapping.has(stop.id)}
                    onPress={() =>
                      router.push({
                        pathname: '/trip/[id]/stops/[stopId]',
                        params: { id: trip.id, stopId: stop.id },
                      })
                    }
                  />
                </Fragment>
              ))
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.bodySemibold,
  },
  day: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dayTitles: {
    flexShrink: 1,
    gap: spacing.xs,
  },
  dayTitle: {
    ...typography.largeSemibold,
  },
  dayDate: {
    ...typography.small,
  },
  addButton: {
    width: ADD_BUTTON_SIZE,
    height: ADD_BUTTON_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  empty: {
    ...typography.small,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
});
