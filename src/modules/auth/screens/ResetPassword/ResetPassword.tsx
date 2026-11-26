import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';
import type { TextInputInstance } from '@/shared/ui/FormField';
import { PillButton } from '@/shared/ui/PillButton';

import { AuthScreen } from '../../components/AuthScreen';
import { AuthSwitchPrompt } from '../../components/AuthSwitchPrompt';
import { FormMessage } from '../../components/FormMessage';
import { PasswordField } from '../../components/PasswordField';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { useResetPasswordForm } from './hooks/useResetPasswordForm';

const ICON_CIRCLE_SIZE = 64;

type StatusIconProps = { symbol: 'envelope' | 'check' | 'warning' };

const StatusIcon = ({ symbol }: StatusIconProps) => {
  const { colors } = useTheme();
  const names = {
    envelope: { ios: 'envelope.fill', android: 'mail', web: 'mail' },
    check: { ios: 'checkmark', android: 'check', web: 'check' },
    warning: { ios: 'exclamationmark.triangle.fill', android: 'warning', web: 'warning' },
  } as const;
  return (
    <View style={[styles.iconCircle, { backgroundColor: colors.accentSecondary }]}>
      <SymbolView tintColor={colors.onAccentSecondary} name={names[symbol]} size={28} />
    </View>
  );
};

// Opened by the link in the password reset email (`.../reset-password?token=...`).
const ResetPassword = () => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const router = useRouter();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string | string[] }>();
  const token = (Array.isArray(tokenParam) ? tokenParam[0] : tokenParam)?.trim() ?? '';

  const { values, errors, formErrorKey, submitting, done, setField, submit } =
    useResetPasswordForm(token);
  const confirmInput = useRef<TextInputInstance>(null);

  const requestNewLink = () => router.replace('/forgot-password');
  const logIn = () => router.replace('/login');

  // The link was opened without its token (cut short in an email, or typed by hand).
  if (token === '') {
    return (
      <AuthScreen title={t('resetPassword.invalidTitle')}>
        <View style={styles.status}>
          <StatusIcon symbol="warning" />
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {t('resetPassword.invalidMessage')}
          </Text>
        </View>
        <PillButton label={t('resetPassword.requestNew')} onPress={requestNewLink} />
      </AuthScreen>
    );
  }

  if (done) {
    return (
      <AuthScreen title={t('resetPassword.successTitle')} showBack={false}>
        <View style={styles.status}>
          <StatusIcon symbol="check" />
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {t('resetPassword.successMessage')}
          </Text>
        </View>
        <PillButton label={t('resetPassword.logIn')} onPress={logIn} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title={t('resetPassword.title')} subtitle={t('resetPassword.subtitle')}>
      <View style={styles.form}>
        <View style={styles.password}>
          <PasswordField
            label={t('fields.newPassword.label')}
            value={values.password}
            onChangeText={(value) => setField('password', value)}
            error={errors.password !== undefined ? t(errors.password) : undefined}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmInput.current?.focus()}
            editable={!submitting}
          />
          <PasswordStrengthMeter password={values.password} />
        </View>
        <PasswordField
          label={t('fields.confirmPassword.label')}
          value={values.confirmPassword}
          onChangeText={(value) => setField('confirmPassword', value)}
          error={errors.confirmPassword !== undefined ? t(errors.confirmPassword) : undefined}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={() => void submit()}
          inputRef={confirmInput}
          editable={!submitting}
        />
      </View>

      {formErrorKey !== null && <FormMessage message={t(formErrorKey)} />}

      <PillButton
        label={t('resetPassword.submit')}
        loadingLabel={t('resetPassword.submitting')}
        loading={submitting}
        onPress={() => void submit()}
      />

      <AuthSwitchPrompt
        question={t('resetPassword.linkNotWorking')}
        action={t('resetPassword.newOne')}
        onPress={requestNewLink}
      />
    </AuthScreen>
  );
};

export default ResetPassword;

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  password: {
    gap: spacing.sm,
  },
  status: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconCircle: {
    width: ICON_CIRCLE_SIZE,
    height: ICON_CIRCLE_SIZE,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...typography.large,
    textAlign: 'center',
  },
});
