import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfileIdentity } from '@/modules/profile/screens/Profile/hooks/useProfileIdentity';
import { getInitials } from '@/modules/profile/screens/Profile/utils/getInitials';
import { typography, useTheme } from '@/shared/theme';
import { Avatar } from '@/shared/ui/Avatar';

export const Header = () => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();
  const router = useRouter();
  const { displayName } = useProfileIdentity();

  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
        {t('title')}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('header.avatarLabel')}
        onPress={() => router.push('/profile')}
        style={({ pressed }) => pressed && styles.pressed}>
        <Avatar initials={getInitials(displayName)} label={t('header.avatarLabel')} />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    flexShrink: 1,
    ...typography.screenTitle,
  },
  pressed: {
    opacity: 0.8,
  },
});
