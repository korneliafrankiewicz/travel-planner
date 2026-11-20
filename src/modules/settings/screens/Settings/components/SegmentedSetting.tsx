import { StyleSheet, Text, View } from 'react-native';

import { spacing, useTheme } from '@/shared/theme';
import { SegmentedControl, type SegmentedOption } from '@/shared/ui/SegmentedControl';

type SegmentedSettingProps<T extends string> = {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

// A settings row: a label with a segmented control below it.
export const SegmentedSetting = <T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedSettingProps<T>) => {
  const { colors } = useTheme();

  return (
    <View style={styles.setting}>
      <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      <SegmentedControl label={label} options={options} value={value} onChange={onChange} />
    </View>
  );
};

const styles = StyleSheet.create({
  setting: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
  },
});
