import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

type StatTileProps = {
  value: number;
  label: string;
  // Uses the secondary accent fill to make one tile stand out.
  highlighted?: boolean;
};

export const StatTile = ({ value, label, highlighted = false }: StatTileProps) => {
  const { colors } = useTheme();

  const backgroundColor = highlighted ? colors.accentSecondary : colors.surface;
  const valueColor = highlighted ? colors.onAccentSecondary : colors.textPrimary;
  const labelColor = highlighted ? colors.onAccentSecondary : colors.textSecondary;

  return (
    <View
      accessible
      accessibilityLabel={`${label}: ${value}`}
      style={[styles.tile, { backgroundColor, borderColor: colors.border }]}>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      <Text numberOfLines={1} style={[styles.label, { color: labelColor }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    gap: spacing.xs,
  },
  value: {
    ...typography.screenTitle,
  },
  label: {
    ...typography.small,
  },
});
