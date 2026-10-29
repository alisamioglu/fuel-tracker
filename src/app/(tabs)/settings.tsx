import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Icon } from '@/components/icon';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { Button, Card, Field, FieldRow, Screen, SectionTitle, Segmented } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { LANGUAGES, useI18n, type LanguageChoice } from '@/i18n';
import { useData, useFormat } from '@/lib/data-context';
import { parseNumber } from '@/lib/format';
import { successFeedback, tapFeedback } from '@/lib/haptics';
import { ensurePermission, sendTestNotification } from '@/lib/notifications';
import {
  CAR_EMOJIS,
  CURRENCIES,
  KIND_EMOJI,
  MAINTENANCE_KINDS,
  type MaintenanceKind,
} from '@/lib/types';
import { CURRENCY_SYMBOLS } from '@/lib/units';

function CarCard() {
  const { settings, updateSettings } = useData();
  const { t } = useI18n();
  const theme = useTheme();
  const [name, setName] = useState(settings.carName);

  return (
    <Card>
      <View style={styles.emojiRow}>
        {CAR_EMOJIS.map((emoji) => {
          const selected = emoji === settings.carEmoji;
          return (
            <Pressable
              key={emoji}
              onPress={() => {
                tapFeedback();
                updateSettings({ carEmoji: emoji });
              }}
              style={[
                styles.emojiChoice,
                { backgroundColor: selected ? theme.primarySoft : 'transparent' },
                selected && { borderColor: theme.primary },
              ]}>
              <ThemedText style={styles.carEmoji}>{emoji}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <Field
        label={t('carName')}
        value={name}
        onChangeText={setName}
        onEndEditing={() => updateSettings({ carName: name.trim() })}
        placeholder={t('carNamePlaceholder')}
        returnKeyType="done"
      />
    </Card>
  );
}

function LanguagePicker() {
  const { t, choice, setChoice } = useI18n();
  const theme = useTheme();
  const options: { code: LanguageChoice; name: string }[] = [
    { code: 'system', name: `📱 ${t('phoneLanguage')}` },
    ...LANGUAGES,
  ];

  return (
    <Card style={styles.listCard}>
      {options.map((option, i) => {
        const selected = option.code === choice;
        return (
          <Pressable
            key={option.code}
            onPress={() => {
              tapFeedback();
              setChoice(option.code);
            }}
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

function IntervalEditor({ kind, onDone }: { kind: MaintenanceKind; onDone: () => void }) {
  const { intervals, setInterval } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const interval = intervals[kind];
  const [distance, setDistance] = useState(String(Math.round(format.toDistance(interval.km))));
  const [months, setMonths] = useState(String(interval.months));

  function save() {
    const distanceValue = parseNumber(distance);
    const monthsValue = parseNumber(months);
    const valid =
      Number.isInteger(distanceValue) && distanceValue >= 0 && Number.isInteger(monthsValue) && monthsValue >= 1;
    if (!valid) {
      Alert.alert(t('checkNumbers'), t('invalidInterval'));
      return;
    }
    setInterval(kind, { km: Math.round(format.fromDistance(distanceValue)), months: monthsValue });
    successFeedback();
    onDone();
  }

  return (
    <View style={styles.editor}>
      <FieldRow>
        <Field
          label={t('everyKm', { unit: format.distanceUnit })}
          value={distance}
          onChangeText={setDistance}
          keyboardType="numeric"
          hint={t('onlyTime')}
        />
        <Field
          label={t('orMonths')}
          value={months}
          onChangeText={setMonths}
          keyboardType="numeric"
        />
      </FieldRow>
      <Button label={t('save')} icon="check" variant="secondary" onPress={save} />
    </View>
  );
}

function Intervals() {
  const { intervals } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const theme = useTheme();
  const [open, setOpen] = useState<MaintenanceKind | null>(null);

  return (
    <Card style={styles.listCard}>
      {MAINTENANCE_KINDS.map((kind, i) => {
        const interval = intervals[kind];
        const summary =
          interval.km > 0
            ? t('intervalSummary', { distance: format.distance(interval.km), months: interval.months })
            : t('intervalSummaryTime', { months: interval.months });
        return (
          <View
            key={kind}
            style={i > 0 && { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth }}>
            <Pressable
              onPress={() => {
                tapFeedback();
                setOpen(open === kind ? null : kind);
              }}
              style={styles.listRow}>
              <ThemedText style={styles.kindEmoji}>{KIND_EMOJI[kind]}</ThemedText>
              <ThemedText type="smallBold" style={styles.flex}>
                {t(kind)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {summary}
              </ThemedText>
            </Pressable>
            {open === kind && <IntervalEditor kind={kind} onDone={() => setOpen(null)} />}
          </View>
        );
      })}
    </Card>
  );
}

export default function SettingsScreen() {
  const { settings, updateSettings } = useData();
  const { t } = useI18n();
  const theme = useTheme();
  const toast = useToast();

  async function test() {
    if (!(await ensurePermission())) {
      Alert.alert(t('notifOffTitle'), t('notifOffBody'));
      return;
    }
    await sendTestNotification();
    toast({ emoji: '🔔', title: t('notifTestTitle'), body: t('notifTestBody') });
  }

  return (
    <Screen title={t('settingsTitle')}>
      <SectionTitle>{t('car')}</SectionTitle>
      <CarCard />

      <SectionTitle>{t('currency')}</SectionTitle>
      <Segmented
        value={settings.currency}
        onChange={(currency) => updateSettings({ currency })}
        options={CURRENCIES.map((c) => ({ value: c, label: `${CURRENCY_SYMBOLS[c]} ${c}` }))}
      />

      <SectionTitle>{t('units')}</SectionTitle>
      <Segmented
        value={settings.units}
        onChange={(units) => updateSettings({ units })}
        options={[
          { value: 'metric', label: t('unitsMetric') },
          { value: 'imperial', label: t('unitsImperial') },
        ]}
      />

      <SectionTitle>{t('language')}</SectionTitle>
      <LanguagePicker />

      <SectionTitle>{t('intervals')}</SectionTitle>
      <ThemedText type="small" themeColor="textSecondary">
        {t('intervalsHint')}
      </ThemedText>
      <Intervals />

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
  emojiRow: {
    flexDirection: 'row',
    gap: Spacing.half,
  },
  // Each emoji gets an equal share of the row, so all eight fit even on small phones
  emojiChoice: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  carEmoji: {
    fontSize: 22,
    lineHeight: 28,
  },
  listCard: {
    padding: 0,
    gap: 0,
    overflow: 'hidden',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  kindEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  editor: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.three,
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
