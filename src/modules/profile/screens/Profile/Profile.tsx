import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, typography, useTheme } from '@/shared/theme';
import { Avatar } from '@/shared/ui/Avatar';
import { IconButton } from '@/shared/ui/IconButton';

import { StatTile } from './components/StatTile';
import { useProfileIdentity } from './hooks/useProfileIdentity';
import { useTripStats } from './hooks/useTripStats';
import { getInitials } from './utils/getInitials';

const AVATAR_SIZE = 96;

const Profile = () => {
  const { t } = useTranslation('profile');
  const { t: tCommon } = useTranslation('common');
  const { colors } = useTheme();
  const router = useRouter();
  const { displayName, email } = useProfileIdentity();
  const stats = useTripStats();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <IconButton
          label={tCommon('back')}
          symbol={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
          onPress={goBack}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.identity}>
          <Avatar initials={getInitials(displayName)} label={displayName} size={AVATAR_SIZE} />
          <Text accessibilityRole="header" style={[styles.name, { color: colors.textPrimary }]}>
            {displayName}
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{email}</Text>
        </View>

        <View style={styles.stats}>
          <Text accessibilityRole="header" style={[styles.statsTitle, { color: colors.textPrimary }]}>
            {t('stats.title')}
          </Text>
          <View style={styles.statsRow}>
            <StatTile value={stats.total} label={t('stats.total')} />
            <StatTile value={stats.upcoming} label={t('stats.upcoming')} highlighted />
            <StatTile value={stats.past} label={t('stats.past')} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xxl,
  },
  identity: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    ...typography.modalTitle,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  email: {
    ...typography.large,
    textAlign: 'center',
  },
  stats: {
    gap: spacing.md,
  },
  statsTitle: {
    ...typography.bodySemibold,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
