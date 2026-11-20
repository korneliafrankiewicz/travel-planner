import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  type TabTriggerSlotProps,
  type TabListProps,
} from 'expo-router/ui';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { maxContentWidth, radius, spacing, typography, useTheme } from '@/shared/theme';

const AppTabs = () => {
  const { t } = useTranslation('common');

  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          <TabTrigger name="trips" href="/" asChild>
            <TabButton>{t('tabs.trips')}</TabButton>
          </TabTrigger>
          <TabTrigger name="settings" href="/settings" asChild>
            <TabButton>{t('tabs.settings')}</TabButton>
          </TabTrigger>
        </CustomTabList>
      </TabList>
    </Tabs>
  );
};

export default AppTabs;

const TabButton = ({ children, isFocused, ref, ...props }: TabTriggerSlotProps) => {
  const { colors } = useTheme();

  return (
    <Pressable
      {...props}
      // expo-router types `ref` as Ref<typeof View>; Pressable expects the view instance type.
      ref={ref as unknown as ComponentProps<typeof Pressable>['ref']}
      style={({ pressed }) => [
        styles.tabButton,
        isFocused && { backgroundColor: colors.surfaceSelected },
        pressed && styles.pressed,
      ]}>
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? colors.textPrimary : colors.textSecondary },
        ]}>
        {children}
      </Text>
    </Pressable>
  );
};

const CustomTabList = (props: TabListProps) => {
  const { colors } = useTheme();

  return (
    <View {...props} style={styles.tabListContainer}>
      <View
        style={[
          styles.innerContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {props.children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabListContainer: {
    position: 'absolute',
    width: '100%',
    padding: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  innerContainer: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    gap: spacing.sm,
    maxWidth: maxContentWidth,
  },
  pressed: {
    opacity: 0.7,
  },
  tabButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  tabLabel: {
    ...typography.smallSemibold,
  },
});
