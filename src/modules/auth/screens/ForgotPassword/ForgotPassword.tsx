import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';
import { FormField } from '@/shared/ui/FormField';
import { PillButton } from '@/shared/ui/PillButton';

import { AuthScreen } from '../../components/AuthScreen';
import { FormMessage } from '../../components/FormMessage';
import { useForgotPasswordForm } from './hooks/useForgotPasswordForm';

const ICON_CIRCLE_SIZE = 64;

const ForgotPassword = () => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const router = useRouter();
  const { values, errors, formErrorKey, submitting, sentTo, setEmail, submit } =
    useForgotPasswordForm();

  const backToLogIn = () => router.replace('/login');

  // The same text whether or not the address has an account, so it cannot be used to find out
  // who has one.
  if (sentTo !== null) {
    return (
      <AuthScreen title={t('forgotPassword.sentTitle')}>
        <View style={styles.sent}>
          <View style={[styles.iconCircle, { backgroundColor: colors.accentSecondary }]}>
            <SymbolView
              tintColor={colors.onAccentSecondary}
              name={{ ios: 'envelope.fill', android: 'mail', web: 'mail' }}
              size={28}
            />
          </View>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {t('forgotPassword.sentMessage', { email: sentTo })}
          </Text>
        </View>
        <PillButton label={t('forgotPassword.backToLogIn')} onPress={backToLogIn} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title={t('forgotPassword.title')} subtitle={t('forgotPassword.subtitle')}>
      <FormField
        label={t('fields.email.label')}
        placeholder={t('fields.email.placeholder')}
        value={values.email}
        onChangeText={setEmail}
        error={errors.email !== undefined ? t(errors.email) : undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => void submit()}
        editable={!submitting}
      />

      {formErrorKey !== null && <FormMessage message={t(formErrorKey)} />}

      <PillButton
        label={t('forgotPassword.submit')}
        loadingLabel={t('forgotPassword.submitting')}
        loading={submitting}
        onPress={() => void submit()}
      />
    </AuthScreen>
  );
};

export default ForgotPassword;

const styles = StyleSheet.create({
  sent: {
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
