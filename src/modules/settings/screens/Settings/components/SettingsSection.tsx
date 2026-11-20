import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, useTheme } from '@/shared/theme';

type SettingsSectionProps = {
  title: string;
  children: ReactNode;
};

export const SettingsSection = ({ title, children }: SettingsSectionProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textSecondary }]}>
        {title}
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.xl,
  },
});
