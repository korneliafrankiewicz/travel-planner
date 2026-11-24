import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, typography, useTheme } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';

const LOGO_SIZE = 104;

// The first screen of someone who is not logged in.
const Welcome = () => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.hero}>
          <View style={[styles.logo, { backgroundColor: colors.accentSecondary }]}>
            <SymbolView
              tintColor={colors.onAccentSecondary}
              name={{ ios: 'map.fill', android: 'map', web: 'map' }}
              size={52}
            />
          </View>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('welcome.title')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {t('welcome.subtitle')}
          </Text>
        </View>

        <View style={styles.actions}>
          <PillButton label={t('welcome.logIn')} onPress={() => router.push('/login')} />
          <PillButton
            variant="secondary"
            label={t('welcome.createAccount')}
            onPress={() => router.push('/sign-up')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    justifyContent: 'space-between',
    padding: spacing.xl,
    gap: spacing.xl,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.screenTitle,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.large,
    textAlign: 'center',
  },
  actions: {
    gap: spacing.md,
  },
});
