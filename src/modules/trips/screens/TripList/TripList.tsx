import { useMemo } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, useTheme, webTabBarInset } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';
import { SegmentedControl, type SegmentedOption } from '@/shared/ui/SegmentedControl';

import { EmptyState } from './components/EmptyState';
import { Header } from './components/Header';
import { TripCard } from './components/TripCard';
import { useTripList, type TripListTab } from './hooks/useTripList';

const TripList = () => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();
  const { tab, setTab, visibleTrips, today } = useTripList();

  const tabOptions = useMemo<SegmentedOption<TripListTab>[]>(
    () => [
      { value: 'upcoming', label: t('tabs.upcoming') },
      { value: 'past', label: t('tabs.past') },
    ],
    [t],
  );

  // TODO: open the "create trip" flow once it exists.
  const handleNewTrip = () => {};

  const hasTrips = visibleTrips.length > 0;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: spacing.lg + webTabBarInset }]}>
        <Header />
        <SegmentedControl
          label={t('tabs.label')}
          options={tabOptions}
          value={tab}
          onChange={setTab}
        />

        {hasTrips ? (
          <FlatList
            data={visibleTrips}
            keyExtractor={(trip) => trip.id}
            renderItem={({ item }) => <TripCard trip={item} today={today} />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <EmptyState
            message={tab === 'upcoming' ? t('empty.upcoming') : t('empty.past')}
            actionLabel={tab === 'upcoming' ? t('newTrip') : undefined}
            onAction={tab === 'upcoming' ? handleNewTrip : undefined}
          />
        )}

        {hasTrips && (
          <View style={styles.footer}>
            <PillButton label={t('newTrip')} onPress={handleNewTrip} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default TripList;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  list: {
    paddingBottom: spacing.md,
  },
  separator: {
    height: spacing.md,
  },
  // Sits below the list in the normal layout flow, so it never overlaps the tab bar or the cards.
  footer: {
    alignItems: 'center',
    paddingBottom: spacing.sm,
  },
});
