import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { radius, spacing, typography, useTheme } from '@/shared/theme';

import { getPasswordStrength, type PasswordStrength } from '../utils/passwordStrength';

const SEGMENTS = 3;
const filledSegments: Record<PasswordStrength, number> = { weak: 1, fair: 2, strong: 3 };

type PasswordStrengthMeterProps = {
  password: string;
};

// Three bars and a word that show how strong the typed password looks. It is only a hint; the
// rules for accepting a password are in the form's validation.
export const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
  const { t } = useTranslation('auth');
  const { colors } = useTheme();
  const strength = getPasswordStrength(password);

  const colorOf: Record<PasswordStrength, string> = {
    weak: colors.danger,
    fair: colors.accentSecondary,
    strong: colors.accent,
  };

  if (strength === null) {
    return <Text style={[styles.hint, { color: colors.textSecondary }]}>{t('strength.hint')}</Text>;
  }

  return (
    <View
      accessible
      accessibilityLabel={`${t('strength.label')}: ${t(`strength.${strength}`)}`}
      style={styles.container}>
      <View style={styles.bars}>
        {Array.from({ length: SEGMENTS }, (_, index) => (
          <View
            key={index}
            style={[
              styles.bar,
              { backgroundColor: index < filledSegments[strength] ? colorOf[strength] : colors.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{t(`strength.${strength}`)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  bar: {
    flex: 1,
    height: 6,
    borderRadius: radius.pill,
  },
  label: {
    ...typography.smallSemibold,
    minWidth: 56,
    textAlign: 'right',
  },
  hint: {
    ...typography.footnote,
  },
});
