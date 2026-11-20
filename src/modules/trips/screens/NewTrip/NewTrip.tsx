import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { maxContentWidth, spacing, useTheme } from '@/shared/theme';
import { PillButton } from '@/shared/ui/PillButton';

import { DateRangeField } from './components/DateRangeField';
import { FormField } from './components/FormField';
import { useNewTripForm } from './hooks/useNewTripForm';

const NewTrip = () => {
  const { t } = useTranslation('trips');
  const { colors } = useTheme();
  const { values, errors, setField, selectDate, submit, close } = useNewTripForm();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.screen}>
        <View style={styles.header}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.textPrimary }]}>
            {t('newTrip')}
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
          <PillButton label={t('form.save')} onPress={submit} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default NewTrip;

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
    fontSize: 28,
    fontWeight: '700',
  },
  cancel: {
    fontSize: 16,
    fontWeight: '600',
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
