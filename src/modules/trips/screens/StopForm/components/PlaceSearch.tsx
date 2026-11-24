import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { PlaceCoordinates, PlaceResult } from '@/shared/geocoding/searchPlaces';
import { radius, spacing, typography, useTheme } from '@/shared/theme';
import { FormField } from '@/shared/ui/FormField';

import { usePlaceSearch } from '../hooks/usePlaceSearch';

type PlaceSearchProps = {
  // Results near this point are ranked higher.
  near: PlaceCoordinates | null;
  // Leaves out the visible label of the field, e.g. when it sits over a map.
  hideLabel?: boolean;
  onSelect: (place: PlaceResult) => void;
};

// A search field with a list of matching places under it. Choosing one calls `onSelect` and
// clears the field, so the list does not stay open after the choice.
export const PlaceSearch = ({ near, hideLabel = false, onSelect }: PlaceSearchProps) => {
  const { t, i18n } = useTranslation('trips');
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const { status, results } = usePlaceSearch(query, i18n.language, near);

  const handleSelect = (place: PlaceResult) => {
    setQuery('');
    onSelect(place);
  };

  const message =
    status === 'loading'
      ? t('stop.search.searching')
      : status === 'error'
        ? t('stop.search.error')
        : status === 'success' && results.length === 0
          ? t('stop.search.noResults')
          : null;

  return (
    <View style={styles.container}>
      <FormField
        label={t('stop.fields.search.label')}
        placeholder={t('stop.fields.search.placeholder')}
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        optional={!hideLabel}
        hideLabel={hideLabel}
      />

      {message !== null && (
        <Text
          accessibilityLiveRegion="polite"
          style={[styles.message, { color: status === 'error' ? colors.danger : colors.textSecondary }]}>
          {message}
        </Text>
      )}

      {results.length > 0 && (
        <View style={[styles.results, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {results.map((place, index) => (
            <View key={place.id}>
              {index > 0 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={place.details !== '' ? `${place.name}, ${place.details}` : place.name}
                onPress={() => handleSelect(place)}
                style={({ pressed }) => [styles.result, pressed && styles.pressed]}>
                <Text numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>
                  {place.name}
                </Text>
                {place.details !== '' && (
                  <Text numberOfLines={1} style={[styles.details, { color: colors.textSecondary }]}>
                    {place.details}
                  </Text>
                )}
              </Pressable>
            </View>
          ))}
        </View>
      )}

      {results.length > 0 && (
        <Text style={[styles.attribution, { color: colors.textSecondary }]}>
          {t('stop.search.attribution')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  message: {
    ...typography.small,
  },
  results: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
  },
  result: {
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  name: {
    ...typography.largeMedium,
  },
  details: {
    ...typography.small,
  },
  attribution: {
    ...typography.footnote,
  },
});
