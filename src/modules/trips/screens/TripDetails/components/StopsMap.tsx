import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, useTheme } from '@/shared/theme';

import { getMapRegion } from '../utils/mapMarkers';
import type { StopsMapProps } from './StopsMap.types';

const MAP_HEIGHT = 280;

// Native map with one pin per stop that has a place. The web build uses StopsMap.web.tsx,
// because react-native-maps has no web support.
export const StopsMap = ({ markers, onMarkerPress }: StopsMapProps) => {
  const { t } = useTranslation('trips');
  const { colors, scheme } = useTheme();
  const region = getMapRegion(markers);

  if (region === null) {
    return null;
  }

  return (
    <MapView
      // A new set of places starts from a new region; the user's own panning is kept otherwise.
      key={`${region.latitude}:${region.longitude}:${region.latitudeDelta}:${region.longitudeDelta}`}
      accessibilityLabel={t('details.map.title')}
      style={[styles.map, { borderColor: colors.border }]}
      initialRegion={region}
      userInterfaceStyle={scheme}
      toolbarEnabled={false}>
      {markers.map((marker) => (
        <Marker
          key={marker.stopId}
          coordinate={marker.coordinates}
          title={marker.title}
          description={
            marker.dayNumber !== null
              ? t('details.map.markerDescription', {
                  day: marker.dayNumber,
                  time: marker.startTime,
                })
              : marker.startTime
          }
          pinColor={colors.accent}
          onCalloutPress={() => onMarkerPress(marker.stopId)}
        />
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
});
