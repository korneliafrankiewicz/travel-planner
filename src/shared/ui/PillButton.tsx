import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, useTheme } from '@/shared/theme';

type PillButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const PillButton = ({ label, onPress, style }: PillButtonProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.accent },
        pressed && styles.pressed,
        style,
      ]}>
      <Text style={[styles.label, { color: colors.onAccent }]}>{label}</Text>
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
    fontSize: 16,
    fontWeight: '700',
  },
});
