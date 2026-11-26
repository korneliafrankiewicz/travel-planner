import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { spacing } from '@/shared/theme';
import { FormField, type TextInputInstance } from '@/shared/ui/FormField';
import { PillButton } from '@/shared/ui/PillButton';

import { AuthScreen } from '../../components/AuthScreen';
import { AuthSwitchPrompt } from '../../components/AuthSwitchPrompt';
import { FormMessage } from '../../components/FormMessage';
import { PasswordField } from '../../components/PasswordField';
import { PasswordStrengthMeter } from '../../components/PasswordStrengthMeter';
import { TermsCheckbox } from './components/TermsCheckbox';
import { useSignUpForm } from './hooks/useSignUpForm';

const SignUp = () => {
  const { t } = useTranslation('auth');
  const router = useRouter();
  const { values, errors, formErrorKey, submitting, setField, submit } = useSignUpForm();
  const emailInput = useRef<TextInputInstance>(null);
  const passwordInput = useRef<TextInputInstance>(null);
  const confirmInput = useRef<TextInputInstance>(null);

  return (
    <AuthScreen title={t('signUp.title')} subtitle={t('signUp.subtitle')}>
      <View style={styles.form}>
        <FormField
          label={t('fields.name.label')}
          placeholder={t('fields.name.placeholder')}
          value={values.name}
          onChangeText={(value) => setField('name', value)}
          error={errors.name !== undefined ? t(errors.name) : undefined}
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          onSubmitEditing={() => emailInput.current?.focus()}
          editable={!submitting}
        />
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
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordInput.current?.focus()}
          inputRef={emailInput}
          editable={!submitting}
        />
        <View style={styles.password}>
          <PasswordField
            label={t('fields.password.label')}
            value={values.password}
            onChangeText={(value) => setField('password', value)}
            error={errors.password !== undefined ? t(errors.password) : undefined}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmInput.current?.focus()}
            inputRef={passwordInput}
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
          inputRef={confirmInput}
          editable={!submitting}
        />
        <TermsCheckbox
          label={t('signUp.terms')}
          checked={values.acceptTerms}
          onChange={(checked) => setField('acceptTerms', checked)}
          error={errors.acceptTerms !== undefined ? t(errors.acceptTerms) : undefined}
        />
      </View>

      {formErrorKey !== null && <FormMessage message={t(formErrorKey)} />}

      <PillButton
        label={t('signUp.submit')}
        loadingLabel={t('signUp.submitting')}
        loading={submitting}
        onPress={submit}
      />

      <AuthSwitchPrompt
        question={t('signUp.haveAccount')}
        action={t('signUp.logIn')}
        onPress={() => router.replace('/login')}
      />
    </AuthScreen>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  form: {
    gap: spacing.lg,
  },
  password: {
    gap: spacing.sm,
  },
});
