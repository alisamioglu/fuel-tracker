import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Field } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useFormat } from '@/lib/data-context';
import { endOfToday, parseDate, toDateString, todayString, yesterdayString } from '@/lib/format';
import { tapFeedback } from '@/lib/haptics';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

// Calendar picker on the phone, plain text on web, plus quick Today / Yesterday buttons
export function DateField({ value, onChange }: Props) {
  const { t } = useI18n();
  const format = useFormat();
  const theme = useTheme();
  const selectedDate = parseDate(value) ?? endOfToday();

  function pick(date: Date | undefined) {
    if (date) onChange(toDateString(date));
  }

  function openAndroidPicker() {
    DateTimePickerAndroid.open({
      value: selectedDate,
      mode: 'date',
      maximumDate: endOfToday(),
      onValueChange: (_, date) => pick(date),
    });
  }

  const quick = [
    { label: t('today'), value: todayString() },
    { label: t('yesterday'), value: yesterdayString() },
  ];

  return (
    <View style={styles.wrap}>
      {Platform.OS === 'web' ? (
        <Field label={t('date')} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />
      ) : (
        <>
          <ThemedText type="smallBold">{t('date')}</ThemedText>
          <View style={styles.pickerRow}>
            {Platform.OS === 'android' ? (
              <Pressable
                onPress={openAndroidPicker}
                style={[styles.dateButton, { borderColor: theme.border }]}>
                <Icon name="calendar" color={theme.primary} size={18} />
                <ThemedText>{format.date(value)}</ThemedText>
              </Pressable>
            ) : (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="compact"
                maximumDate={endOfToday()}
                accentColor={theme.primary}
                onValueChange={(_, date) => pick(date)}
              />
            )}
          </View>
        </>
      )}

      <View style={styles.chips}>
        {quick.map((q) => {
          const selected = q.value === value;
          return (
            <Pressable
              key={q.label}
              onPress={() => {
                tapFeedback();
                onChange(q.value);
              }}
              style={[styles.chip, { backgroundColor: selected ? theme.primary : theme.primarySoft }]}>
              <ThemedText
                type="smallBold"
                style={{ color: selected ? theme.onPrimary : theme.primary }}>
                {q.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.two,
  },
  pickerRow: {
    flexDirection: 'row',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  chips: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one + Spacing.half,
    borderRadius: 999,
  },
});
