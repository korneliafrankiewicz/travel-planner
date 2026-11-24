import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing, typography, useTheme } from '@/shared/theme';

type AuthSwitchPromptProps = {
  // "No account yet?"
  question: string;
  // "Create one"
  action: string;
  onPress: () => void;
};

// A question with a link, that takes the user to the other screen of the pair
// (log in and sign up).
export const AuthSwitchPrompt = ({ question, action, onPress }: AuthSwitchPromptProps) => {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{question}</Text>
      <Pressable accessibilityRole="link" accessibilityLabel={action} hitSlop={8} onPress={onPress}>
        <Text style={[styles.link, { color: colors.accent }]}>{action}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  text: {
    ...typography.small,
  },
  link: {
    ...typography.smallSemibold,
  },
});
