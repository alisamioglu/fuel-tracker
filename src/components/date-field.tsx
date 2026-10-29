import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Field } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { todayString, yesterdayString } from '@/lib/format';

// Date as text plus two quick buttons, because most of the time it's today or yesterday anyway
export function DateField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();
  const theme = useTheme();

  const quick = [
    { label: t('today'), value: todayString() },
    { label: t('yesterday'), value: yesterdayString() },
  ];

  return (
    <View style={styles.wrap}>
      <Field label={t('date')} value={value} onChangeText={onChange} placeholder="YYYY-MM-DD" />
      <View style={styles.chips}>
        {quick.map((q) => {
          const selected = q.value === value;
          return (
            <Pressable
              key={q.label}
              onPress={() => onChange(q.value)}
              style={[
                styles.chip,
                { backgroundColor: selected ? theme.primary : theme.primarySoft },
              ]}>
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
