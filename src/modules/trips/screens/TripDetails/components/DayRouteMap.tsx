import MapView, { Marker, Polyline } from 'react-native-maps';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import { getRegionForCoordinates } from '../utils/mapMarkers';
import type { DayRouteMapProps } from './DayRouteMap.types';

const MAP_HEIGHT = 300;
const BADGE_SIZE = 28;
const LINE_WIDTH = 3;
const CENTER = { x: 0.5, y: 0.5 } as const;

// The stops of one day as numbered pins, joined by lines in the order of the day, with the
// distance written on each line. The web build uses DayRouteMap.web.tsx.
export const DayRouteMap = ({ route, distanceLabels }: DayRouteMapProps) => {
  const { t } = useTranslation('trips');
  const { colors, scheme } = useTheme();
  const region = getRegionForCoordinates(route.points.map((point) => point.coordinates));

  if (region === null) {
    return null;
  }

  return (
    <MapView
      // A changed route starts from a new region; the user's own panning is kept otherwise.
      key={`${region.latitude}:${region.longitude}:${region.latitudeDelta}:${region.longitudeDelta}`}
      accessibilityLabel={t('itinerary.route.mapLabel')}
      style={[styles.map, { borderColor: colors.border }]}
      initialRegion={region}
      userInterfaceStyle={scheme}
      toolbarEnabled={false}>
      <Polyline
        coordinates={route.points.map((point) => point.coordinates)}
        strokeColor={colors.accent}
        strokeWidth={LINE_WIDTH}
      />

      {route.legs.map((leg, index) => (
        <Marker
          key={`${leg.from.stopId}-${leg.to.stopId}`}
          coordinate={leg.midpoint}
          anchor={CENTER}
          tappable={false}>
          <View
            style={[styles.distance, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.distanceLabel, { color: colors.textPrimary }]}>
              {distanceLabels[index]}
            </Text>
          </View>
        </Marker>
      ))}

      {route.points.map((point) => (
        <Marker
          key={point.stopId}
          coordinate={point.coordinates}
          title={point.title}
          anchor={CENTER}>
          <View style={[styles.badge, { backgroundColor: colors.accent, borderColor: colors.surface }]}>
            <Text style={[styles.badgeLabel, { color: colors.onAccent }]}>{point.order}</Text>
          </View>
        </Marker>
      ))}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    height: MAP_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radius.pill,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    ...typography.captionBold,
  },
  distance: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  distanceLabel: {
    ...typography.captionSemibold,
  },
});
