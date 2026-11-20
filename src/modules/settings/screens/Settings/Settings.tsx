import { ScrollView, StyleSheet, Switch, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import type { AppLanguage } from '@/shared/i18n';
import { maxContentWidth, spacing, typography, useTheme, webTabBarInset, type ThemeScheme } from '@/shared/theme';
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
          <SettingsRow title={t('account.logOut.title')} hint={t('comingSoon')} disabled />
          <SettingsRow
            title={t('account.deleteAccount.title')}
            hint={t('comingSoon')}
            destructive
            disabled
          />
        </SettingsSection>
      </ScrollView>
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
