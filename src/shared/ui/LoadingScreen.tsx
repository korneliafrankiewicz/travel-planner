import { StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '@/shared/theme';

import { Spinner } from './Spinner';

type LoadingScreenProps = {
  // Shown under the spinner and read out as its label, e.g. "Checking your session…".
  label: string;
};

// A full-screen spinner for the time the app needs before it can show anything useful.
export const LoadingScreen = ({ label }: LoadingScreenProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Spinner label={label} size="large" />
      <Text accessibilityLiveRegion="polite" style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  label: {
    ...typography.large,
    textAlign: 'center',
  },
});
