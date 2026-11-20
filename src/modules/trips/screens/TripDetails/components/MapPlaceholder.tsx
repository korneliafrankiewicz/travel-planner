import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';

const ICON_CIRCLE_SIZE = 64;

type MapPlaceholderProps = {
  // Shown under the icon; empty when the trip has no destination.
  destination: string;
  onOpenMaps: () => void;
};

// TODO: replace with an embedded map (markers and routes) once the maps work starts.
export const MapPlaceholder = ({ destination, onOpenMaps }: MapPlaceholderProps) => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t('details.map.title')}
      </Text>
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
          {t('details.map.placeholder')}
        </Text>
        <PillButton
          variant="secondary"
          label={t('details.map.open')}
          onPress={onOpenMaps}
          style={styles.button}
        />
      </View>
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
