import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Field, FieldRow, InfoRow, Screen } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { dueForAll, useData } from '@/lib/data-context';
import {
  formatDate,
  formatNumber,
  makeId,
  parseDate,
  parseNumber,
  toDateString,
  todayString,
} from '@/lib/format';
import type { DueInfo } from '@/lib/maintenance';
import { ensurePermission, sendTestNotification } from '@/lib/notifications';
import { KIND_LABELS, type Interval, type MaintenanceKind } from '@/lib/types';

const KINDS: MaintenanceKind[] = ['oil', 'coolant'];

function DueCard({ info }: { info: DueInfo }) {
  const theme = useTheme();
  const label = KIND_LABELS[info.kind];

  if (!info.last) {
    return (
      <Card title={label}>
        <ThemedText type="small" themeColor="textSecondary">
          Not logged yet. Add your last {label.toLowerCase()} change or check below to get
          reminders.
        </ThemedText>
      </Card>
    );
  }

  return (
    <Card title={label}>
      {info.overdue && (
        <ThemedText type="smallBold" style={{ color: theme.danger }}>
          Due now — time to check it!
        </ThemedText>
      )}
      <InfoRow
        label="Last done"
        value={`${formatDate(info.last.date)} · ${formatNumber(info.last.odometerKm)} km`}
      />
      {info.dueKm !== null && info.kmLeft !== null && (
        <InfoRow
          label={`Due at ${formatNumber(info.dueKm)} km`}
          value={info.kmLeft > 0 ? `${formatNumber(info.kmLeft)} km left` : 'reached'}
        />
      )}
      {info.dueDate && info.daysLeft !== null && (
        <InfoRow
          label={`Due by ${formatDate(toDateString(info.dueDate))}`}
          value={info.daysLeft > 0 ? `${Math.ceil(info.daysLeft)} days left` : 'reached'}
        />
      )}
      {info.remindAt && (
        <InfoRow label="Reminder set for" value={formatDate(toDateString(info.remindAt))} />
      )}
    </Card>
  );
}

function IntervalEditor({ kind, interval }: { kind: MaintenanceKind; interval: Interval }) {
  const { setInterval } = useData();
  const [km, setKm] = useState(String(interval.km));
  const [months, setMonths] = useState(String(interval.months));

  function save() {
    const kmValue = parseNumber(km);
    const monthsValue = parseNumber(months);
    if (!(kmValue > 0) || !(monthsValue > 0) || !Number.isInteger(monthsValue)) {
      Alert.alert('Check the numbers', 'Km and months must be positive (months as a whole number).');
      return;
    }
    setInterval(kind, { km: kmValue, months: monthsValue });
    Alert.alert('Saved', `${KIND_LABELS[kind]}: every ${formatNumber(kmValue)} km or ${monthsValue} months.`);
  }

  return (
    <View style={styles.intervalBlock}>
      <ThemedText type="small">{KIND_LABELS[kind]}</ThemedText>
      <FieldRow>
        <Field label="Every (km)" value={km} onChangeText={setKm} keyboardType="numeric" />
        <Field label="or (months)" value={months} onChangeText={setMonths} keyboardType="numeric" />
      </FieldRow>
      <Button label="Save interval" variant="plain" onPress={save} />
    </View>
  );
}

export default function MaintenanceScreen() {
  const data = useData();
  const { maintenance, intervals, addMaintenance, removeMaintenance } = data;
  const theme = useTheme();

  const [kind, setKind] = useState<MaintenanceKind>('oil');
  const [odometer, setOdometer] = useState('');
  const [date, setDate] = useState(todayString());
  const [note, setNote] = useState('');

  const dueList = dueForAll(data);

  async function handleAdd() {
    const odometerKm = parseNumber(odometer);
    if (!(odometerKm > 0)) {
      Alert.alert('Missing info', 'Please enter the odometer km.');
      return;
    }
    if (!parseDate(date)) {
      Alert.alert('Wrong date', 'Please write the date like 2026-10-29.');
      return;
    }
    addMaintenance({ id: makeId(), kind, date, odometerKm, note: note.trim() || undefined });
    setOdometer('');
    setNote('');
    setDate(todayString());

    // First log is a good moment to ask for notification permission
    const granted = await ensurePermission();
    if (!granted) {
      Alert.alert(
        'Notifications are off',
        'Saved, but I can only remind you if notifications are allowed in the phone settings.',
      );
    }
  }

  async function sendTest() {
    if (!(await ensurePermission())) {
      Alert.alert('Notifications are off', 'Allow notifications in the phone settings first.');
      return;
    }
    await sendTestNotification();
  }

  function confirmRemove(id: string) {
    Alert.alert('Delete record?', 'This entry will be removed for good.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeMaintenance(id) },
    ]);
  }

  const history = [...maintenance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen title="Maintenance">
      {dueList.map((info) => (
        <DueCard key={info.kind} info={info} />
      ))}

      <Card title="Log a change or check">
        <View style={styles.kindRow}>
          {KINDS.map((k) => {
            const selected = k === kind;
            return (
              <Pressable
                key={k}
                onPress={() => setKind(k)}
                style={[
                  styles.kindChip,
                  { borderColor: selected ? theme.primary : theme.border },
                  selected && { backgroundColor: theme.primary },
                ]}>
                <ThemedText type="smallBold" style={selected && styles.selectedText}>
                  {KIND_LABELS[k]}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <FieldRow>
          <Field
            label="Odometer (km)"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            placeholder="e.g. 17000"
          />
          <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </FieldRow>
        <Field label="Note (optional)" value={note} onChangeText={setNote} placeholder="e.g. 5W-30, topped up" />
        <Button label="Save" onPress={handleAdd} />
      </Card>

      <Card title="Reminder intervals">
        {KINDS.map((k) => (
          <IntervalEditor key={k} kind={k} interval={intervals[k]} />
        ))}
        <Button label="Send a test notification" variant="plain" onPress={sendTest} />
      </Card>

      <ThemedText type="smallBold" themeColor="textSecondary">
        History ({maintenance.length})
      </ThemedText>

      {history.map((entry) => (
        <Card key={entry.id}>
          <InfoRow label={KIND_LABELS[entry.kind]} value={formatDate(entry.date)} />
          <InfoRow label="Odometer" value={`${formatNumber(entry.odometerKm)} km`} />
          {entry.note && <ThemedText type="small">{entry.note}</ThemedText>}
          <Button label="Delete" variant="danger" onPress={() => confirmRemove(entry.id)} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kindRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  kindChip: {
    borderWidth: 1,
    borderRadius: Spacing.four,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  selectedText: {
    color: '#ffffff',
  },
  intervalBlock: {
    gap: Spacing.one,
  },
});
