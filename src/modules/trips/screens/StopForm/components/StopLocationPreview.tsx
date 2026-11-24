import MapView, { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, useTheme } from '@/shared/theme';

import { getRegionForCoordinates } from '../../TripDetails/utils/mapMarkers';
import type { StopLocationPreviewProps } from './StopLocationPreview.types';

const PREVIEW_HEIGHT = 180;

// A small map that shows where the stop is. It cannot be moved; the place is changed with the
// location picker. The web build uses StopLocationPreview.web.tsx.
export const StopLocationPreview = ({ coordinates }: StopLocationPreviewProps) => {
  const { t } = useTranslation('trips');
  const { colors, scheme } = useTheme();
  const region = getRegionForCoordinates([coordinates]);

  if (region === null) {
    return null;
  }

  return (
    <MapView
      accessibilityLabel={t('stop.locationPreview')}
      style={[styles.map, { borderColor: colors.border }]}
      region={region}
      userInterfaceStyle={scheme}
      scrollEnabled={false}
      zoomEnabled={false}
      rotateEnabled={false}
      pitchEnabled={false}
      toolbarEnabled={false}>
      <Marker coordinate={coordinates} pinColor={colors.accent} />
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    height: PREVIEW_HEIGHT,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
