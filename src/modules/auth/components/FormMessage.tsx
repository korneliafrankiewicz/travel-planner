import { StyleSheet, Text, View } from 'react-native';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

type FormMessageProps = {
  message: string;
};

// An error that belongs to the whole form (wrong password, no connection), not to one field.
// Screen readers announce it as soon as it appears.
export const FormMessage = ({ message }: FormMessageProps) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.box, { borderColor: colors.danger, backgroundColor: colors.surface }]}>
      <Text
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
        style={[styles.text, { color: colors.danger }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  text: {
    ...typography.small,
  },
});
