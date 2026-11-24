import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
  // Leaves out the visible label (it stays as the accessibility label), for fields that sit in
  // a layout of their own, such as a search box over a map.
  hideLabel?: boolean;
  multiline?: boolean;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  maxLength?: number;
};

export const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  optional = false,
  hideLabel = false,
  multiline = false,
  autoCapitalize = 'sentences',
  autoCorrect,
  keyboardType,
  maxLength,
}: FormFieldProps) => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error !== undefined ? colors.danger : focused ? colors.accent : colors.border;

  return (
    <View style={styles.field}>
      {!hideLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>
          {optional && (
            <Text style={[styles.optional, { color: colors.textSecondary }]}>
              {t('form.optional')}
            </Text>
          )}
        </View>
      )}
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        keyboardType={keyboardType}
        maxLength={maxLength}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          styles.input,
          multiline && styles.multiline,
          { backgroundColor: colors.surface, borderColor, color: colors.textPrimary },
        ]}
      />
      {error !== undefined && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    gap: spacing.sm,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  label: {
    ...typography.bodySemibold,
  },
  optional: {
    ...typography.footnote,
  },
  input: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...typography.large,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  error: {
    ...typography.footnote,
  },
});
