import { StyleSheet, Text, View } from 'react-native';

import { fontWeight, useTheme } from '@/shared/theme';

// Initials take up this fraction of the avatar's size.
const INITIALS_FONT_RATIO = 0.38;

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
      <Text style={[styles.initials, { color: colors.onAccent, fontSize: size * INITIALS_FONT_RATIO }]}>
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
    fontWeight: fontWeight.bold,
  },
});
