import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, Card, Field, Screen, Segmented } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useData } from '@/lib/data-context';
import { makeId, parseDate, parseNumber, todayString } from '@/lib/format';
import { currentOdometer } from '@/lib/maintenance';
import { ensurePermission } from '@/lib/notifications';
import type { MaintenanceKind } from '@/lib/types';

export default function AddServiceScreen() {
  const params = useLocalSearchParams<{ kind?: string }>();
  const { fuel, maintenance, addMaintenance } = useData();
  const { t, number } = useI18n();

  const [kind, setKind] = useState<MaintenanceKind>(params.kind === 'coolant' ? 'coolant' : 'oil');
  const [odometer, setOdometer] = useState('');
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');

  const knownKm = currentOdometer(fuel, maintenance);

  async function save() {
    const odometerKm = parseNumber(odometer);
    if (!(odometerKm > 0)) {
      Alert.alert(t('missingTitle'), t('missingKm'));
      return;
    }
    if (!parseDate(date)) {
      Alert.alert(t('wrongDateTitle'), t('wrongDateBody', { example: todayString() }));
      return;
    }

    addMaintenance({ id: makeId(), kind, date, odometerKm, note: note.trim() || undefined });
    router.back();

    // Saving a service is a good moment to ask for notification permission
    if (!(await ensurePermission())) {
      Alert.alert(t('notifOffTitle'), t('notifOffBody'));
    }
  }

  return (
    <Screen modal>
      <Card>
        <Segmented
          value={kind}
          onChange={setKind}
          options={[
            { value: 'oil', label: t('oil'), icon: 'oil' },
            { value: 'coolant', label: t('coolant'), icon: 'coolant' },
          ]}
        />
        <Field
          label={t('odometer')}
          unit="km"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder={knownKm > 0 ? String(knownKm) : '17000'}
          hint={knownKm > 0 ? t('lastOdometer', { km: number(knownKm) }) : t('odometerHint')}
        />
        <DateField value={date} onChange={setDate} />
        <Field
          label={t('note')}
          value={note}
          onChangeText={setNote}
          placeholder={t('notePlaceholder')}
        />
      </Card>
      <Button label={t('save')} icon="check" onPress={save} />
    </Screen>
  );
}
