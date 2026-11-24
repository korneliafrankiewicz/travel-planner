import { ActivityIndicator, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/shared/theme';

type SpinnerProps = {
  // Read out by screen readers, e.g. "Logging in…". The spinner has no visible text.
  label: string;
  size?: 'small' | 'large';
  // Color of the spinner; defaults to the accent color.
  color?: string;
  style?: StyleProp<ViewStyle>;
};

// A themed loading spinner.
export const Spinner = ({ label, size = 'small', color, style }: SpinnerProps) => {
  const { colors } = useTheme();

  return (
    <ActivityIndicator
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      size={size}
      color={color ?? colors.accent}
      style={style}
    />
  );
};
