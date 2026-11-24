import { SymbolView } from 'expo-symbols';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';

import type { StopMarker } from '../utils/mapMarkers';
import { StopsMap } from './StopsMap';

const ICON_CIRCLE_SIZE = 64;

type MapSectionProps = {
  // Shown on the fallback card; empty when the trip has no destination.
  destination: string;
  // The stops that have a place on the map.
  markers: StopMarker[];
  onMarkerPress: (stopId: string) => void;
  onOpenMaps: () => void;
};

// The trip's stops on a map. Without any stop that has a place (or on the web, where the map
// is not available) it shows a card that explains how to get pins and links to Google Maps.
export const MapSection = ({ destination, markers, onMarkerPress, onOpenMaps }: MapSectionProps) => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();

  const showMap = markers.length > 0 && Platform.OS !== 'web';

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t('details.map.title')}
      </Text>
      {showMap ? (
        <>
          <StopsMap markers={markers} onMarkerPress={onMarkerPress} />
          <PillButton variant="secondary" label={t('details.map.open')} onPress={onOpenMaps} />
        </>
      ) : (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentSecondary }]}>
            <SymbolView
              tintColor={colors.onAccentSecondary}
              name={{ ios: 'map.fill', android: 'map', web: 'map' }}
              size={28}
            />
          </View>
          <Text style={[styles.destination, { color: colors.textPrimary }]}>
            {destination !== '' ? destination : t('details.noDestination')}
          </Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('details.map.empty')}
          </Text>
          <PillButton
            variant="secondary"
            label={t('details.map.open')}
            onPress={onOpenMaps}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.bodySemibold,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: ICON_CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  destination: {
    ...typography.cardTitle,
    textAlign: 'center',
  },
  hint: {
    ...typography.small,
    textAlign: 'center',
  },
  button: {
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
});
