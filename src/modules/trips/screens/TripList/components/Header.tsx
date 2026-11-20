import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Avatar } from '@/shared/ui/Avatar';
import { typography, useTheme } from '@/shared/theme';

// TODO: replace with the initials of the signed-in user once accounts exist.
const PLACEHOLDER_INITIALS = 'AB';

export const Header = () => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();

  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
        {t('title')}
      </Text>
      <Avatar initials={PLACEHOLDER_INITIALS} label={t('header.avatarLabel')} />
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
});
