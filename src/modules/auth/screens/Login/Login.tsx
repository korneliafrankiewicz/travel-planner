import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing, typography, useTheme } from '@/shared/theme';
import { FormField, type TextInputInstance } from '@/shared/ui/FormField';
import { PillButton } from '@/shared/ui/PillButton';

import { AuthScreen } from '../../components/AuthScreen';
import { AuthSwitchPrompt } from '../../components/AuthSwitchPrompt';
import { FormMessage } from '../../components/FormMessage';
import { PasswordField } from '../../components/PasswordField';
import { useLoginForm } from './hooks/useLoginForm';

const Login = () => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const router = useRouter();
  const { values, errors, formErrorKey, submitting, setField, submit } = useLoginForm();
  const passwordInput = useRef<TextInputInstance>(null);

  return (
    <AuthScreen title={t('logIn.title')} subtitle={t('logIn.subtitle')}>
      <View style={styles.form}>
        <FormField
          label={t('fields.email.label')}
          placeholder={t('fields.email.placeholder')}
          value={values.email}
          onChangeText={(value) => setField('email', value)}
          error={errors.email !== undefined ? t(errors.email) : undefined}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="next"
          onSubmitEditing={() => passwordInput.current?.focus()}
          editable={!submitting}
        />
        <PasswordField
          label={t('fields.password.label')}
          value={values.password}
          onChangeText={(value) => setField('password', value)}
          error={errors.password !== undefined ? t(errors.password) : undefined}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          inputRef={passwordInput}
          editable={!submitting}
        />
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t('logIn.forgotPassword')}
          hitSlop={8}
          onPress={() => router.push('/forgot-password')}
          style={styles.forgot}>
          <Text style={[styles.forgotLabel, { color: colors.accent }]}>
            {t('logIn.forgotPassword')}
          </Text>
        </Pressable>
      </View>

      {formErrorKey !== null && <FormMessage message={t(formErrorKey)} />}

      <PillButton
        label={t('logIn.submit')}
        loadingLabel={t('logIn.submitting')}
        loading={submitting}
        onPress={submit}
      />

      <AuthSwitchPrompt
        question={t('logIn.noAccount')}
        action={t('logIn.createOne')}
        onPress={() => router.replace('/sign-up')}
      />
    </AuthScreen>
  );
};

export default Login;

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  forgot: {
    alignSelf: 'flex-end',
  },
  forgotLabel: {
    ...typography.smallSemibold,
  },
});
