import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

type PillButtonProps = {
  label: string;
  onPress: () => void;
  // `primary` uses the main accent, `secondary` uses the secondary accent.
  variant?: 'primary' | 'secondary';
  style?: StyleProp<ViewStyle>;
};

export const PillButton = ({ label, onPress, variant = 'primary', style }: PillButtonProps) => {
  const { colors } = useTheme();
  const backgroundColor = variant === 'primary' ? colors.accent : colors.accentSecondary;
  const textColor = variant === 'primary' ? colors.onAccent : colors.onAccentSecondary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor }, pressed && styles.pressed, style]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    ...typography.largeBold,
  },
});
