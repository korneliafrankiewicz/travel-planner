import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, useTheme, webTabBarInset } from '@/shared/theme';

// Placeholder screen: only the title for now.
const Settings = () => {
  const { t } = useTranslation('settings');
  const { colors } = useTheme();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: spacing.lg + webTabBarInset }]}>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
          {t('screenTitle')}
        </Text>
      </View>
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
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
});
