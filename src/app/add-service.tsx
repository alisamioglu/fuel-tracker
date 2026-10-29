import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { Button, Card, Field, Screen } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useData, useFormat } from '@/lib/data-context';
import { makeId, parseDate, parseNumber, todayString } from '@/lib/format';
import { successFeedback, tapFeedback, warningFeedback } from '@/lib/haptics';
import { currentOdometer } from '@/lib/maintenance';
import { ensurePermission } from '@/lib/notifications';
import { KIND_EMOJI, MAINTENANCE_KINDS, type MaintenanceKind } from '@/lib/types';

function isKind(value: string | undefined): value is MaintenanceKind {
  return MAINTENANCE_KINDS.includes(value as MaintenanceKind);
}

// Same screen for a new record and for editing one (when an id comes in)
export default function AddServiceScreen() {
  const params = useLocalSearchParams<{ kind?: string; id?: string }>();
  const { fuel, maintenance, saveMaintenanceEntry, removeMaintenance } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const theme = useTheme();
  const toast = useToast();

  const existing = maintenance.find((e) => e.id === params.id);
  const [kind, setKind] = useState<MaintenanceKind>(
    existing?.kind ?? (isKind(params.kind) ? params.kind : 'oil'),
  );
  const [odometer, setOdometer] = useState(
    existing ? String(Math.round(format.toDistance(existing.odometerKm))) : '',
  );
  const [date, setDate] = useState(existing?.date ?? todayString());
  const [place, setPlace] = useState(existing?.place ?? '');
  const [note, setNote] = useState(existing?.note ?? '');

  const knownKm = currentOdometer(fuel, maintenance);

  async function save() {
    const odometerKm = format.fromDistance(parseNumber(odometer));
    if (!(odometerKm > 0)) {
      Alert.alert(t('missingTitle'), t('missingKm'));
      return;
    }
    if (!parseDate(date)) {
      Alert.alert(t('wrongDateTitle'), t('wrongDateBody', { example: todayString() }));
      return;
    }

    saveMaintenanceEntry({
      id: existing?.id ?? makeId(),
      kind,
      date,
      odometerKm,
      place: place.trim() || undefined,
      note: note.trim() || undefined,
    });
    successFeedback();
    toast({
      emoji: existing ? '✏️' : KIND_EMOJI[kind],
      title: existing ? t('toastUpdated') : t('toastServiceSaved'),
      body: existing ? undefined : t(kind),
    });
    router.back();

    // Saving a service is a good moment to ask for notification permission
    if (!(await ensurePermission())) {
      Alert.alert(t('notifOffTitle'), t('notifOffBody'));
    }
  }

  function remove() {
    if (!existing) return;
    Alert.alert(t('deleteTitle'), t('deleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          removeMaintenance(existing.id);
          warningFeedback();
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen modal>
      <Stack.Screen options={{ title: existing ? t('editService') : t('logService') }} />
      <Card>
        <ThemedText type="smallBold">{t('type')}</ThemedText>
        <View style={styles.kindGrid}>
          {MAINTENANCE_KINDS.map((k) => {
            const selected = k === kind;
            return (
              <Pressable
                key={k}
                onPress={() => {
                  tapFeedback();
                  setKind(k);
                }}
                style={[
                  styles.kindChip,
                  {
                    backgroundColor: selected ? theme.primary : theme.backgroundSelected,
                  },
                ]}>
                <ThemedText style={styles.kindEmoji}>{KIND_EMOJI[k]}</ThemedText>
                <ThemedText
                  type="smallBold"
                  style={{ color: selected ? theme.onPrimary : theme.text }}>
                  {t(k)}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Field
          label={t('odometer')}
          unit={format.distanceUnit}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder={knownKm > 0 ? String(Math.round(format.toDistance(knownKm))) : '17000'}
          hint={
            existing
              ? undefined
              : knownKm > 0
                ? t('lastOdometer', { distance: format.distance(knownKm) })
                : t('odometerHint')
          }
        />
        <DateField value={date} onChange={setDate} />
        <Field
          label={t('place')}
          value={place}
          onChangeText={setPlace}
          placeholder={t('placePlaceholder')}
        />
        <Field
          label={t('note')}
          value={note}
          onChangeText={setNote}
          placeholder={t('notePlaceholder')}
        />
      </Card>

      <Button label={t('save')} icon="check" onPress={save} />
      {existing && <Button label={t('deleteEntry')} icon="trash" variant="danger" onPress={remove} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kindGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one + Spacing.half,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  kindEmoji: {
    fontSize: 16,
    lineHeight: 22,
  },
});
