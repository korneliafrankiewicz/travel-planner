import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/shared/theme';

type AvatarProps = {
  initials: string;
  label: string;
  size?: number;
};

export const Avatar = ({ initials, label, size = 44 }: AvatarProps) => {
  const { colors } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accent },
      ]}>
      <Text style={[styles.initials, { color: colors.onAccent, fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '700',
  },
});
