import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

const BOX_SIZE = 24;

type TermsCheckboxProps = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
};

// A checkbox with its label, for accepting the terms.
export const TermsCheckbox = ({ label, checked, onChange, error }: TermsCheckboxProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityLabel={label}
        accessibilityState={{ checked }}
        onPress={() => onChange(!checked)}
        style={styles.row}>
        <View
          style={[
            styles.box,
            {
              borderColor: error !== undefined ? colors.danger : checked ? colors.accent : colors.border,
              backgroundColor: checked ? colors.accent : colors.surface,
            },
          ]}>
          {checked && (
            <SymbolView
              tintColor={colors.onAccent}
              name={{ ios: 'checkmark', android: 'check', web: 'check' }}
              size={16}
            />
          )}
        </View>
        <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
      </Pressable>
      {error !== undefined && (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.small,
    flex: 1,
  },
  error: {
    ...typography.footnote,
  },
});
