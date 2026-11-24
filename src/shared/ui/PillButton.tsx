import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import { Spinner } from './Spinner';

type PillButtonProps = {
  label: string;
  onPress: () => void;
  // `primary` uses the main accent, `secondary` uses the secondary accent.
  variant?: 'primary' | 'secondary';
  // Shows a spinner instead of the label and ignores presses, e.g. while a request runs. The
  // button keeps its size, so nothing jumps.
  loading?: boolean;
  // Read out by screen readers while `loading` ("Logging in…"); defaults to the label.
  loadingLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export const PillButton = ({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  loadingLabel,
  disabled = false,
  style,
}: PillButtonProps) => {
  const { colors } = useTheme();
  const backgroundColor = variant === 'primary' ? colors.accent : colors.accentSecondary;
  const textColor = variant === 'primary' ? colors.onAccent : colors.onAccentSecondary;
  const inactive = loading || disabled;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={loading ? (loadingLabel ?? label) : label}
      accessibilityState={{ busy: loading, disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor },
        disabled && !loading && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}>
      {/* The label stays in place (hidden while loading) so the button keeps its width. */}
      <Text style={[styles.label, { color: textColor }, loading && styles.hidden]}>{label}</Text>
      {loading && (
        <View style={[StyleSheet.absoluteFill, styles.spinner]}>
          <Spinner label={loadingLabel ?? label} color={textColor} />
        </View>
      )}
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
  disabled: {
    opacity: 0.5,
  },
  hidden: {
    opacity: 0,
  },
  spinner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.largeBold,
  },
});
