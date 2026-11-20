import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '@/shared/theme';

const DISABLED_OPACITY = 0.7;

type SettingsRowProps = {
  title: string;
  // Text shown at the end of the row, and read out as the accessibility hint.
  hint?: string;
  // Control shown at the end of the row, e.g. a switch.
  trailing?: ReactNode;
  destructive?: boolean;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'switch';
  // Only for `accessibilityRole="switch"`.
  checked?: boolean;
};

// A single-line settings row. Placeholder rows are `disabled` until their feature exists.
export const SettingsRow = ({
  title,
  hint,
  trailing,
  destructive = false,
  disabled = false,
  accessibilityRole = 'button',
  checked,
}: SettingsRowProps) => {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityRole={accessibilityRole}
      accessibilityLabel={title}
      accessibilityHint={hint}
      accessibilityState={{ disabled, checked }}
      style={[styles.row, disabled && styles.disabled]}>
      <Text style={[styles.title, { color: destructive ? colors.danger : colors.textPrimary }]}>
        {title}
      </Text>
      {trailing ?? (
        hint !== undefined && (
          <Text style={[styles.hint, { color: colors.textSecondary }]}>{hint}</Text>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  title: {
    flexShrink: 1,
    ...typography.largeMedium,
  },
  hint: {
    ...typography.small,
  },
  disabled: {
    opacity: DISABLED_OPACITY,
  },
});
