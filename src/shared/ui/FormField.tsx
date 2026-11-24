import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

const ACCESSORY_WIDTH = 56;

// What a ref to the field's input points at, e.g. to move the focus to it.
export type TextInputInstance = ComponentRef<typeof TextInput>;

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
  // Hides what is typed, for passwords.
  secureTextEntry?: boolean;
  // Tell the system what the field holds, so password managers and autofill can help.
  autoComplete?: TextInputProps['autoComplete'];
  textContentType?: TextInputProps['textContentType'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  // Lets the screen move the focus to this field, e.g. from the previous one.
  inputRef?: Ref<TextInputInstance>;
  editable?: boolean;
  // A control shown inside the field at its end, e.g. a "show password" button.
  accessory?: ReactNode;
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
  secureTextEntry,
  autoComplete,
  textContentType,
  returnKeyType,
  onSubmitEditing,
  inputRef,
  editable,
  accessory,
}: FormFieldProps) => {
  const { t } = useTranslation('common');
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
              {t('optional')}
            </Text>
          )}
        </View>
      )}
      <View>
        <TextInput
          ref={inputRef}
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
          secureTextEntry={secureTextEntry}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          editable={editable}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[
            styles.input,
            multiline && styles.multiline,
            accessory !== undefined && styles.withAccessory,
            { backgroundColor: colors.surface, borderColor, color: colors.textPrimary },
          ]}
        />
        {accessory !== undefined && <View style={styles.accessory}>{accessory}</View>}
      </View>
      {error !== undefined && (
        <Text accessibilityLiveRegion="polite" style={[styles.error, { color: colors.danger }]}>
          {error}
        </Text>
      )}
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
  withAccessory: {
    paddingRight: ACCESSORY_WIDTH,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: 'top',
  },
  accessory: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: ACCESSORY_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  error: {
    ...typography.footnote,
  },
});
