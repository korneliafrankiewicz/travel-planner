import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, radius, spacing, typography, useTheme } from '@/shared/theme';
import { FormField } from '@/shared/ui/FormField';
import { PillButton } from '@/shared/ui/PillButton';
import { SegmentedControl, type SegmentedOption } from '@/shared/ui/SegmentedControl';

import type { PlaceResult } from '@/shared/geocoding/searchPlaces';

import type { Coordinates, StopType } from '../TripList/schema/stopSchema';
import { DayChips } from './components/DayChips';
import { LocationPicker } from './components/LocationPicker';
import { PlaceSearch } from './components/PlaceSearch';
import { StopLocationPreview } from './components/StopLocationPreview';
import type { StopFormState } from './hooks/useStopForm';
import { getRegionForCoordinates } from '../TripDetails/utils/mapMarkers';
import { formatCoordinate, getFormCoordinates } from './utils/pickedLocation';
import { formatTimeInput } from './utils/timeInput';

type StopFormProps = {
  title: string;
  submitLabel: string;
  form: StopFormState;
  // Places of the trip's other stops. The location picker opens near them when this stop has
  // no place yet.
  tripPlaces?: Coordinates[];
  // When provided, a delete button is shown (used when editing an existing stop).
  onDeleteRequest?: () => void;
};

// Full-screen form used by both the "new stop" and the "edit stop" screens.
export const StopForm = ({
  title,
  submitLabel,
  form,
  tripPlaces = [],
  onDeleteRequest,
}: StopFormProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();
  const { values, errors, days, setField, submit, close } = form;
  const [pickingLocation, setPickingLocation] = useState(false);

  // react-native-maps has no web support, so there the coordinates are only typed in.
  const canPickLocation = Platform.OS !== 'web';
  const currentLocation = getFormCoordinates(values);
  const hasLocationText = values.latitude !== '' || values.longitude !== '';

  // Searched places are ranked by how close they are to the stop, or else to the trip.
  const searchNear = currentLocation ?? getRegionForCoordinates(tripPlaces);

  const applyLocation = ({ latitude, longitude }: Coordinates) => {
    setField('latitude', formatCoordinate(latitude));
    setField('longitude', formatCoordinate(longitude));
  };

  const handleLocationPicked = (coordinates: Coordinates) => {
    applyLocation(coordinates);
    setPickingLocation(false);
  };

  const handlePlaceFound = (place: PlaceResult) => {
    applyLocation(place.coordinates);
    // A stop still without a title is named after the place that was found.
    if (values.title.trim() === '') {
      setField('title', place.name);
    }
  };

  const handleLocationClear = () => {
    setField('latitude', '');
    setField('longitude', '');
  };

  const typeOptions: SegmentedOption<StopType>[] = [
    { value: 'lodging', label: t('stop.types.lodging') },
    { value: 'meal', label: t('stop.types.meal') },
    { value: 'attraction', label: t('stop.types.attraction') },
    { value: 'other', label: t('stop.types.other') },
  ];

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('form.cancel')}
            hitSlop={spacing.md}
            onPress={close}>
            <Text style={[styles.cancel, { color: colors.accent }]}>{t('form.cancel')}</Text>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('stop.fields.type.label')}
            </Text>
            <SegmentedControl
              label={t('stop.fields.type.label')}
              options={typeOptions}
              value={values.type}
              onChange={(type) => setField('type', type)}
            />
          </View>

          <FormField
            label={t('stop.fields.title.label')}
            placeholder={t('stop.fields.title.placeholder')}
            value={values.title}
            onChangeText={(value) => setField('title', value)}
            error={errors.title !== undefined ? t(errors.title) : undefined}
          />

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('stop.fields.day.label')}
            </Text>
            <DayChips
              days={days}
              value={values.date}
              onChange={(date) => setField('date', date)}
              language={i18n.language}
            />
            {errors.date !== undefined && (
              <Text style={[styles.error, { color: colors.danger }]}>{t(errors.date)}</Text>
            )}
          </View>

          <View style={styles.row}>
            <View style={styles.rowItem}>
              <FormField
                label={t('stop.fields.startTime.label')}
                placeholder={t('stop.fields.startTime.placeholder')}
                value={values.startTime}
                onChangeText={(value) => setField('startTime', formatTimeInput(value))}
                keyboardType="number-pad"
                maxLength={5}
                autoCorrect={false}
                error={errors.startTime !== undefined ? t(errors.startTime) : undefined}
              />
            </View>
            <View style={styles.rowItem}>
              <FormField
                label={t('stop.fields.duration.label')}
                placeholder={t('stop.fields.duration.placeholder')}
                value={values.duration}
                onChangeText={(value) => setField('duration', value.replace(/\D/g, ''))}
                keyboardType="number-pad"
                maxLength={4}
                autoCorrect={false}
                error={errors.duration !== undefined ? t(errors.duration) : undefined}
              />
            </View>
          </View>

          <FormField
            label={t('form.fields.notes.label')}
            placeholder={t('form.fields.notes.placeholder')}
            value={values.notes}
            onChangeText={(value) => setField('notes', value)}
            optional
            multiline
          />
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textPrimary }]}>
              {t('stop.fields.location.label')}
            </Text>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t('stop.fields.location.hint')}
            </Text>
            <PlaceSearch near={searchNear} onSelect={handlePlaceFound} />
            {canPickLocation && currentLocation !== null && (
              <StopLocationPreview coordinates={currentLocation} />
            )}
            {canPickLocation && (
              <PillButton
                variant="secondary"
                label={
                  currentLocation !== null
                    ? t('stop.fields.location.change')
                    : t('stop.fields.location.choose')
                }
                onPress={() => setPickingLocation(true)}
              />
            )}
            <View style={styles.row}>
              <View style={styles.rowItem}>
                <FormField
                  label={t('stop.fields.latitude.label')}
                  placeholder={t('stop.fields.latitude.placeholder')}
                  value={values.latitude}
                  onChangeText={(value) => setField('latitude', value)}
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  optional
                  error={errors.latitude !== undefined ? t(errors.latitude) : undefined}
                />
              </View>
              <View style={styles.rowItem}>
                <FormField
                  label={t('stop.fields.longitude.label')}
                  placeholder={t('stop.fields.longitude.placeholder')}
                  value={values.longitude}
                  onChangeText={(value) => setField('longitude', value)}
                  keyboardType="numbers-and-punctuation"
                  autoCorrect={false}
                  optional
                  error={errors.longitude !== undefined ? t(errors.longitude) : undefined}
                />
              </View>
            </View>
            {hasLocationText && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('stop.fields.location.clear')}
                hitSlop={spacing.md}
                onPress={handleLocationClear}
                style={styles.clear}>
                <Text style={[styles.clearLabel, { color: colors.accent }]}>
                  {t('stop.fields.location.clear')}
                </Text>
              </Pressable>
            )}
          </View>
          <FormField
            label={t('stop.fields.url.label')}
            placeholder={t('stop.fields.url.placeholder')}
            value={values.url}
            onChangeText={(value) => setField('url', value)}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            optional
            error={errors.url !== undefined ? t(errors.url) : undefined}
          />

          {onDeleteRequest !== undefined && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('stop.delete')}
              onPress={onDeleteRequest}
              style={({ pressed }) => [
                styles.deleteButton,
                { borderColor: colors.danger },
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.deleteLabel, { color: colors.danger }]}>{t('stop.delete')}</Text>
            </Pressable>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <PillButton label={submitLabel} onPress={submit} />
        </View>
      </KeyboardAvoidingView>

      <LocationPicker
        visible={pickingLocation}
        initialCoordinates={currentLocation}
        tripPlaces={tripPlaces}
        onConfirm={handleLocationPicked}
        onCancel={() => setPickingLocation(false)}
      />
    </SafeAreaView>
  );
};

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
  form: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  field: {
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySemibold,
  },
  error: {
    ...typography.footnote,
  },
  hint: {
    ...typography.small,
  },
  clear: {
    alignSelf: 'flex-start',
  },
  clearLabel: {
    ...typography.smallSemibold,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  rowItem: {
    flex: 1,
  },
  deleteButton: {
    minHeight: 48,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteLabel: {
    ...typography.bodyBold,
  },
  pressed: {
    opacity: 0.8,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
});
