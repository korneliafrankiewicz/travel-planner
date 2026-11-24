import { useState } from 'react';
import MapView, { Marker } from 'react-native-maps';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, typography, useTheme } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';

import type { Coordinates } from '../../TripList/schema/stopSchema';
import { getPickerRegion, toPickedCoordinates } from '../utils/pickedLocation';
import type { LocationPickerProps } from './LocationPicker.types';

type PickerContentProps = Omit<LocationPickerProps, 'visible'>;

const PickerContent = ({
  initialCoordinates,
  tripPlaces,
  onConfirm,
  onCancel,
}: PickerContentProps) => {
  const { t } = useTranslation('trips');
  const { colors, scheme } = useTheme();
  const [picked, setPicked] = useState<Coordinates | null>(initialCoordinates);
  // The map only starts here; after that the user moves it freely.
  const [region] = useState(() => getPickerRegion(initialCoordinates, tripPlaces));

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          {t('stop.locationPicker.title')}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('form.cancel')}
          hitSlop={spacing.md}
          onPress={onCancel}>
          <Text style={[styles.cancel, { color: colors.accent }]}>{t('form.cancel')}</Text>
        </Pressable>
      </View>

      <MapView
        accessibilityLabel={t('stop.locationPicker.mapLabel')}
        style={styles.map}
        initialRegion={region}
        userInterfaceStyle={scheme}
        toolbarEnabled={false}
        onPress={(event) => setPicked(toPickedCoordinates(event.nativeEvent.coordinate))}>
        {picked !== null && (
          <Marker
            coordinate={picked}
            pinColor={colors.accent}
            draggable
            onDragEnd={(event) => setPicked(toPickedCoordinates(event.nativeEvent.coordinate))}
          />
        )}
      </MapView>

      <View style={styles.footer}>
        {picked === null ? (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            {t('stop.locationPicker.hint')}
          </Text>
        ) : (
          <>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t('stop.locationPicker.hintPlaced')}
            </Text>
            <PillButton
              label={t('stop.locationPicker.confirm')}
              onPress={() => onConfirm(picked)}
              style={styles.confirm}
            />
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

// Full-screen map where the user taps (or drags the pin) to choose where a stop is.
// The web build uses LocationPicker.web.tsx, because react-native-maps has no web support.
export const LocationPicker = ({ visible, ...content }: LocationPickerProps) => (
  <Modal animationType="slide" visible={visible} onRequestClose={content.onCancel}>
    {/* Mounted only while open, so the pin and the map start fresh every time. */}
    {visible && <PickerContent {...content} />}
  </Modal>
);

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
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.modalTitle,
  },
  cancel: {
    ...typography.largeSemibold,
  },
  map: {
    flex: 1,
  },
  footer: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  hint: {
    ...typography.small,
    textAlign: 'center',
  },
  confirm: {
    alignSelf: 'stretch',
  },
});
