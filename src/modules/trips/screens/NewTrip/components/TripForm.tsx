import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, typography, useTheme } from '@/shared/theme';
import { FormField } from '@/shared/ui/FormField';
import { PillButton } from '@/shared/ui/PillButton';

import type { TripFormState } from '../hooks/useTripForm';
import { DateRangeField } from './DateRangeField';

type TripFormProps = {
  title: string;
  submitLabel: string;
  form: TripFormState;
};

// Full-screen form used by both the "new trip" and the "edit trip" screens.
export const TripForm = ({ title, submitLabel, form }: TripFormProps) => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();
  const { values, errors, today, setField, selectDate, submit, close } = form;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {title}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('form.cancel')}
            hitSlop={spacing.md}
            onPress={close}>
            <Text style={[styles.cancel, { color: colors.accent }]}>{t('form.cancel')}</Text>
          </Pressable>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.form}>
          <FormField
            label={t('form.fields.title.label')}
            placeholder={t('form.fields.title.placeholder')}
            value={values.title}
            onChangeText={(value) => setField('title', value)}
            error={errors.title !== undefined ? t(errors.title) : undefined}
          />
          <FormField
            label={t('form.fields.destination.label')}
            placeholder={t('form.fields.destination.placeholder')}
            value={values.destination}
            onChangeText={(value) => setField('destination', value)}
            optional
          />
          <DateRangeField
            startDate={values.startDate}
            endDate={values.endDate}
            minDate={today}
            onSelect={selectDate}
            error={errors.dates !== undefined ? t(errors.dates) : undefined}
          />
          <FormField
            label={t('form.fields.notes.label')}
            placeholder={t('form.fields.notes.placeholder')}
            value={values.notes}
            onChangeText={(value) => setField('notes', value)}
            optional
            multiline
          />
        </ScrollView>

        <View style={styles.footer}>
          <PillButton label={submitLabel} onPress={submit} />
        </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  title: {
    ...typography.modalTitle,
  },
  cancel: {
    ...typography.largeSemibold,
  },
  form: {
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xl,
  },
  footer: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
});
