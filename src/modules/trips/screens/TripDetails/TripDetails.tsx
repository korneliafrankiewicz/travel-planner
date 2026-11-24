import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, radius, spacing, typography, useTheme } from '@/shared/theme';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import { IconButton } from '@/shared/ui/IconButton';

import { useStopCount, useStopsStore } from '../TripList/store/stopsStore';
import { useTripsStore } from '../TripList/store/tripsStore';
import { formatDateRange, getTripDayCount } from '../TripList/utils/tripDates';
import { ItinerarySection } from './components/ItinerarySection';
import { MapSection } from './components/MapSection';
import { getGoogleMapsSearchUrl } from './utils/maps';
import { getStopMarkers } from './utils/mapMarkers';

const TripDetails = () => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const trip = useTripsStore((state) => state.trips.find((item) => item.id === id));
  const deleteTrip = useTripsStore((state) => state.deleteTrip);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Keep showing the last known trip while the screen animates away after a delete,
  // instead of flashing an empty screen.
  const [lastTrip, setLastTrip] = useState(trip);
  if (trip !== undefined && trip !== lastTrip) {
    setLastTrip(trip);
  }
  const shownTrip = trip ?? lastTrip;
  const stopCount = useStopCount(shownTrip?.id ?? '');
  const allStops = useStopsStore((state) => state.stops);

  // An unknown id (e.g. a stale link) has nothing to show, so go back to the list.
  if (shownTrip === undefined) {
    return <Redirect href="/" />;
  }

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleEdit = () =>
    router.push({ pathname: '/trip/[id]/edit', params: { id: shownTrip.id } });

  const handleDelete = () => {
    setConfirmingDelete(false);
    deleteTrip(shownTrip.id);
    goBack();
  };

  const handleOpenMaps = () => {
    const query = shownTrip.destination !== '' ? shownTrip.destination : shownTrip.title;
    // TODO: show a message to the user when the link cannot be opened.
    Linking.openURL(getGoogleMapsSearchUrl(query)).catch(() => {});
  };

  const dayCount = getTripDayCount(shownTrip);
  const markers = getStopMarkers(
    shownTrip,
    allStops.filter((stop) => stop.tripId === shownTrip.id),
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton
          label={t('details.back')}
          symbol={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          onPress={goBack}
        />
        <View style={styles.headerActions}>
          <IconButton
            label={t('details.edit')}
            symbol={{ ios: 'pencil', android: 'edit', web: 'edit' }}
            onPress={handleEdit}
          />
          <IconButton
            label={t('details.delete')}
            symbol={{ ios: 'trash', android: 'delete', web: 'delete' }}
            tintColor={colors.danger}
            onPress={() => setConfirmingDelete(true)}
          />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.summary}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {shownTrip.title}
          </Text>
          {shownTrip.destination !== '' && (
            <Text style={[styles.destination, { color: colors.textSecondary }]}>
              {shownTrip.destination}
            </Text>
          )}
          <View style={styles.dateRow}>
            <Text style={[styles.dates, { color: colors.textPrimary }]}>
              {formatDateRange(shownTrip, i18n.language)}
            </Text>
            <View style={[styles.chip, { backgroundColor: colors.accentSecondary }]}>
              <Text style={[styles.chipLabel, { color: colors.onAccentSecondary }]}>
                {t('summary.days', { count: dayCount })}
              </Text>
            </View>
          </View>
          <Text style={[styles.stops, { color: colors.textSecondary }]}>
            {t('summary.stops', { count: stopCount })}
          </Text>
        </View>

        {shownTrip.notes !== '' && (
          <View style={styles.notes}>
            <Text
              accessibilityRole="header"
              style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('form.fields.notes.label')}
            </Text>
            <View
              style={[
                styles.notesCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}>
              <Text style={[styles.notesText, { color: colors.textPrimary }]}>{shownTrip.notes}</Text>
            </View>
          </View>
        )}

        <ItinerarySection trip={shownTrip} />

        <MapSection
          destination={shownTrip.destination}
          markers={markers}
          onMarkerPress={(stopId) =>
            router.push({
              pathname: '/trip/[id]/stops/[stopId]',
              params: { id: shownTrip.id, stopId },
            })
          }
          onOpenMaps={handleOpenMaps}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirmingDelete}
        title={t('delete.title')}
        message={t('delete.message', { title: shownTrip.title })}
        confirmLabel={t('delete.confirm')}
        cancelLabel={t('form.cancel')}
        onConfirm={handleDelete}
        onCancel={() => setConfirmingDelete(false)}
      />
    </SafeAreaView>
  );
};

export default TripDetails;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  summary: {
    gap: spacing.xs,
  },
  title: {
    ...typography.screenTitle,
  },
  destination: {
    ...typography.large,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  dates: {
    ...typography.largeSemibold,
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipLabel: {
    ...typography.captionBold,
  },
  stops: {
    ...typography.small,
  },
  notes: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySemibold,
  },
  notesCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
  },
  notesText: {
    ...typography.body,
  },
});
