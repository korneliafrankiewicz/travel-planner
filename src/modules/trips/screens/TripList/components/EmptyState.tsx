import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { spacing, useTheme } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';

type EmptyStateProps = {
  message: string;
  // When provided, the empty state shows a primary button with this label.
  actionLabel?: string;
  onAction?: () => void;
};

export const EmptyState = ({ message, actionLabel, onAction }: EmptyStateProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <SymbolView
        tintColor={colors.textSecondary}
        name={{ ios: 'airplane', android: 'flight', web: 'flight' }}
        size={48}
      />
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
      {actionLabel !== undefined && onAction !== undefined && (
        <PillButton label={actionLabel} onPress={onAction} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});
