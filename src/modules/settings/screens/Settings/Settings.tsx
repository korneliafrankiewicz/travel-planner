import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { AppLanguage } from '@/shared/i18n';
import { maxContentWidth, spacing, typography, useTheme, webTabBarInset, type ThemeScheme } from '@/shared/theme';
import { useSessionStore } from '@/shared/auth/sessionStore';
import { resetSampleData } from '@/modules/trips/screens/TripList/store/resetSampleData';
import { ConfirmDialog } from '@/shared/ui/ConfirmDialog';
import type { SegmentedOption } from '@/shared/ui/SegmentedControl';

import { ProfileCard } from './components/ProfileCard';
import { SegmentedSetting } from './components/SegmentedSetting';
import { SettingsRow } from './components/SettingsRow';
import { SettingsSection } from './components/SettingsSection';
import { useSettingsStore } from './store/settingsStore';

const Settings = () => {
  const { t } = useTranslation('settings');
  const { colors } = useTheme();
  const theme = useSettingsStore((state) => state.theme);
  const language = useSettingsStore((state) => state.language);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const setLanguage = useSettingsStore((state) => state.setLanguage);
  const signOut = useSessionStore((state) => state.signOut);
  const [confirmingLogOut, setConfirmingLogOut] = useState(false);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    resetSampleData();
    setConfirmingReset(false);
    setResetDone(true);
  };

  const themeOptions: SegmentedOption<ThemeScheme>[] = [
    { value: 'light', label: t('theme.options.light') },
    { value: 'dark', label: t('theme.options.dark') },
  ];

  const languageOptions: SegmentedOption<AppLanguage>[] = [
    { value: 'pl', label: t('language.options.pl') },
    { value: 'en', label: t('language.options.en') },
  ];

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: spacing.lg + webTabBarInset }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          {t('screenTitle')}
        </Text>

        <ProfileCard />

        <SettingsSection title={t('sections.appearance')}>
          <SegmentedSetting
            label={t('theme.title')}
            options={themeOptions}
            value={theme}
            onChange={setTheme}
          />
          <SegmentedSetting
            label={t('language.title')}
            options={languageOptions}
            value={language}
            onChange={setLanguage}
          />
        </SettingsSection>

        {/* Placeholders: these rows have no behavior until authentication exists. */}
        <SettingsSection title={t('sections.security')}>
          <SettingsRow
            title={t('security.biometric.title')}
            hint={t('comingSoon')}
            accessibilityRole="switch"
            checked={false}
            disabled
            trailing={
              <Switch
                disabled
                value={false}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={colors.surface}
              />
            }
          />
          <SettingsRow title={t('security.changePin.title')} hint={t('comingSoon')} disabled />
          <SettingsRow title={t('security.lockAfter.title')} hint={t('comingSoon')} disabled />
        </SettingsSection>

        <SettingsSection title={t('sections.account')}>
          <SettingsRow title={t('account.logOut.title')} onPress={() => setConfirmingLogOut(true)} />
          <SettingsRow
            title={t('account.deleteAccount.title')}
            hint={t('comingSoon')}
            destructive
            disabled
          />
        </SettingsSection>

        {/* For testing only: replaces saved trips with the sample ones. Never shown to users. */}
        {__DEV__ && (
          <SettingsSection title={t('sections.developer')}>
            <SettingsRow
              title={t('developer.resetSampleData.title')}
              hint={resetDone ? t('developer.resetSampleData.done') : t('developer.resetSampleData.hint')}
              onPress={() => {
                setResetDone(false);
                setConfirmingReset(true);
              }}
            />
          </SettingsSection>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={confirmingLogOut}
        title={t('account.logOut.confirm.title')}
        message={t('account.logOut.confirm.message')}
        confirmLabel={t('account.logOut.confirm.confirm')}
        cancelLabel={t('account.logOut.confirm.cancel')}
        onConfirm={() => {
          setConfirmingLogOut(false);
          void signOut();
        }}
        onCancel={() => setConfirmingLogOut(false)}
      />

      <ConfirmDialog
        visible={confirmingReset}
        title={t('developer.resetSampleData.confirm.title')}
        message={t('developer.resetSampleData.confirm.message')}
        confirmLabel={t('developer.resetSampleData.confirm.confirm')}
        cancelLabel={t('developer.resetSampleData.confirm.cancel')}
        onConfirm={handleReset}
        onCancel={() => setConfirmingReset(false)}
      />
    </SafeAreaView>
  );
};

export default Settings;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  title: {
    ...typography.screenTitle,
  },
});
