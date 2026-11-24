import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/shared/theme';
import { FormField } from '@/shared/ui/FormField';

type PasswordFieldProps = Omit<React.ComponentProps<typeof FormField>, 'secureTextEntry' | 'accessory'>;

// A password field with a button that shows or hides what was typed.
export const PasswordField = (props: PasswordFieldProps) => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const label = visible ? t('fields.password.hide') : t('fields.password.show');

  return (
    <FormField
      {...props}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      accessory={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          hitSlop={8}
          onPress={() => setVisible((current) => !current)}
          style={styles.toggle}>
          <SymbolView
            tintColor={colors.textSecondary}
            name={
              visible
                ? { ios: 'eye.slash', android: 'visibility_off', web: 'visibility_off' }
                : { ios: 'eye', android: 'visibility', web: 'visibility' }
            }
            size={20}
          />
        </Pressable>
      }
    />
  );
};

const styles = StyleSheet.create({
  toggle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
