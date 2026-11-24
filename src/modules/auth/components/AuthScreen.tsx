import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, typography, useTheme } from '@/shared/theme';
import { IconButton } from '@/shared/ui/IconButton';

type AuthScreenProps = {
  title: string;
  subtitle?: string;
  // Shows a back button. The first screen of the flow (Welcome) has none.
  showBack?: boolean;
  children: ReactNode;
};

// The layout the log in, sign up and password reset screens share: a back button, a title and a
// form that moves up out of the keyboard's way.
export const AuthScreen = ({ title, subtitle, showBack = true, children }: AuthScreenProps) => {
  const { t } = useTranslation('common');
  const { colors } = useTheme();
  const router = useRouter();

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/welcome');
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <View style={styles.header}>
          {showBack && (
            <IconButton
              label={t('back')}
              symbol={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              onPress={goBack}
            />
          )}
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}>
          <View style={styles.titles}>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
              {title}
            </Text>
            {subtitle !== undefined && (
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
            )}
          </View>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    minHeight: 44 + spacing.lg * 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  titles: {
    gap: spacing.sm,
  },
  title: {
    ...typography.screenTitle,
  },
  subtitle: {
    ...typography.large,
  },
});
