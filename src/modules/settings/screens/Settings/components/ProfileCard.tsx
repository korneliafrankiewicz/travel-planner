import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfileIdentity } from '@/modules/profile/screens/Profile/hooks/useProfileIdentity';
import { getInitials } from '@/modules/profile/screens/Profile/utils/getInitials';
import { radius, spacing, typography, useTheme } from '@/shared/theme';
import { Avatar } from '@/shared/ui/Avatar';

const AVATAR_SIZE = 56;

// Summary of the signed-in user. Tapping it opens the Profile screen.
export const ProfileCard = () => {
  const { t } = useTranslation('profile');
  const { colors } = useTheme();
  const router = useRouter();
  const { displayName, email } = useProfileIdentity();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('screenTitle')}: ${displayName}`}
      onPress={() => router.push('/profile')}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <Avatar initials={getInitials(displayName)} label={displayName} size={AVATAR_SIZE} />
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.textPrimary }]}>
          {displayName}
        </Text>
        <Text numberOfLines={1} style={[styles.email, { color: colors.textSecondary }]}>
          {email}
        </Text>
      </View>
      <SymbolView
        tintColor={colors.textSecondary}
        name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
        size={16}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.8,
  },
  text: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    ...typography.largeSemibold,
  },
  email: {
    ...typography.small,
  },
});
