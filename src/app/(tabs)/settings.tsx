import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { Button, Card, Field, FieldRow, IconBadge, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES, useI18n, type LanguageChoice } from '@/i18n';
import { useData } from '@/lib/data-context';
import { parseNumber } from '@/lib/format';
import { ensurePermission, sendTestNotification } from '@/lib/notifications';
import { MAINTENANCE_KINDS, type MaintenanceKind } from '@/lib/types';

function LanguagePicker() {
  const { t, choice, setChoice } = useI18n();
  const theme = useTheme();
  const options: { code: LanguageChoice; name: string }[] = [
    { code: 'system', name: t('phoneLanguage') },
    ...LANGUAGES,
  ];

  return (
    <Card style={styles.listCard}>
      {options.map((option, i) => {
        const selected = option.code === choice;
        return (
          <Pressable
            key={option.code}
            onPress={() => setChoice(option.code)}
            style={({ pressed }) => [
              styles.listRow,
              i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
              pressed && { backgroundColor: theme.backgroundSelected },
            ]}>
            <ThemedText type={selected ? 'smallBold' : 'small'} style={styles.flex}>
              {option.name}
            </ThemedText>
            {selected && <Icon name="check" color={theme.primary} size={18} />}
          </Pressable>
        );
      })}
    </Card>
  );
}

function IntervalsEditor() {
  const { intervals, setInterval } = useData();
  const { t, number } = useI18n();
  // Text state per kind, so half-typed numbers don't get saved
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(
      MAINTENANCE_KINDS.map((k) => [k, { km: String(intervals[k].km), months: String(intervals[k].months) }]),
    ) as Record<MaintenanceKind, { km: string; months: string }>,
  );

  function change(kind: MaintenanceKind, field: 'km' | 'months', value: string) {
    setDraft({ ...draft, [kind]: { ...draft[kind], [field]: value } });
  }

  function save() {
    const parsed = MAINTENANCE_KINDS.map((kind) => ({
      kind,
      km: parseNumber(draft[kind].km),
      months: parseNumber(draft[kind].months),
    }));
    const valid = parsed.every(
      (p) => p.km > 0 && p.months > 0 && Number.isInteger(p.km) && Number.isInteger(p.months),
    );
    if (!valid) {
      Alert.alert(t('checkNumbers'), t('invalidInterval'));
      return;
    }
    parsed.forEach((p) => setInterval(p.kind, { km: p.km, months: p.months }));
    Alert.alert(
      t('saved'),
      parsed.map((p) => `${t(p.kind)}: ${number(p.km)} km / ${p.months}`).join('\n'),
    );
  }

  return (
    <Card>
      <ThemedText type="small" themeColor="textSecondary">
        {t('intervalsHint')}
      </ThemedText>
      {MAINTENANCE_KINDS.map((kind) => (
        <View key={kind} style={styles.intervalBlock}>
          <View style={styles.intervalHeader}>
            <IconBadge name={kind} size={28} />
            <ThemedText type="smallBold">{t(kind)}</ThemedText>
          </View>
          <FieldRow>
            <Field
              label={t('everyKm')}
              unit="km"
              value={draft[kind].km}
              onChangeText={(v) => change(kind, 'km', v)}
              keyboardType="numeric"
            />
            <Field
              label={t('orMonths')}
              value={draft[kind].months}
              onChangeText={(v) => change(kind, 'months', v)}
              keyboardType="numeric"
            />
          </FieldRow>
        </View>
      ))}
      <Button label={t('save')} icon="check" onPress={save} />
    </Card>
  );
}

export default function SettingsScreen() {
  const { t } = useI18n();
  const theme = useTheme();

  async function test() {
    if (!(await ensurePermission())) {
      Alert.alert(t('notifOffTitle'), t('notifOffBody'));
      return;
    }
    await sendTestNotification();
  }

  return (
    <Screen title={t('settingsTitle')}>
      <SectionTitle>{t('language')}</SectionTitle>
      <LanguagePicker />

      <SectionTitle>{t('intervals')}</SectionTitle>
      <IntervalsEditor />

      <SectionTitle>{t('notifications')}</SectionTitle>
      <Button label={t('testNotification')} icon="bell" variant="secondary" onPress={test} />

      <View style={styles.note}>
        <Icon name="lock" color={theme.textSecondary} size={14} />
        <ThemedText type="small" themeColor="textSecondary">
          {t('dataNote')}
        </ThemedText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  listCard: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  intervalBlock: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  intervalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    marginTop: Spacing.three,
  },
});
