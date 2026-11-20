import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/shared/theme';

const BUTTON_SIZE = 44;
const ICON_SIZE = 20;

type IconButtonProps = {
  label: string;
  symbol: SymbolViewProps['name'];
  onPress: () => void;
  // Icon color; defaults to the primary text color.
  tintColor?: string;
};

export const IconButton = ({ label, symbol, onPress, tintColor }: IconButtonProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: colors.surface, borderColor: colors.border },
        pressed && styles.pressed,
      ]}>
      <SymbolView name={symbol} tintColor={tintColor ?? colors.textPrimary} size={ICON_SIZE} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
