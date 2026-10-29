import { router } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  IconBadge,
  IconButton,
  Pill,
  ProgressBar,
  Screen,
  SectionTitle,
  type Tone,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { dueForAll, useData } from '@/lib/data-context';
import { toDateString } from '@/lib/format';
import type { DueInfo, DueStatus } from '@/lib/maintenance';
import type { MaintenanceKind } from '@/lib/types';

const STATUS_TONE: Record<DueStatus, Tone> = {
  none: 'neutral',
  ok: 'success',
  soon: 'warning',
  due: 'danger',
};

function openAdd(kind?: MaintenanceKind) {
  router.push(kind ? { pathname: '/add-service', params: { kind } } : '/add-service');
}

function StatusCard({ info }: { info: DueInfo }) {
  const { t, number, date } = useI18n();
  const tone = STATUS_TONE[info.status];
  const statusLabel = { ok: t('statusOk'), soon: t('statusSoon'), due: t('statusDue') };

  return (
    <Pressable onPress={() => openAdd(info.kind)}>
      <Card>
        <View style={styles.cardHeader}>
          <IconBadge name={info.kind} tone={tone === 'neutral' ? 'primary' : tone} />
          <ThemedText type="default" style={styles.cardTitle}>
            {t(info.kind)}
          </ThemedText>
          {info.status !== 'none' && <Pill label={statusLabel[info.status]} tone={tone} />}
        </View>

        {!info.last ? (
          <ThemedText type="small" themeColor="textSecondary">
            {t('notLoggedBody')}
          </ThemedText>
        ) : (
          <>
            <ProgressBar value={info.progress} tone={tone} />
            <View style={styles.leftRow}>
              {info.kmLeft !== null && (
                <ThemedText type="smallBold">
                  {info.kmLeft > 0
                    ? t('kmLeft', { km: number(info.kmLeft) })
                    : t('kmOver', { km: number(-info.kmLeft) })}
                </ThemedText>
              )}
              {info.daysLeft !== null && (
                <ThemedText type="smallBold">
                  {info.daysLeft > 0
                    ? t('daysLeft', { days: Math.ceil(info.daysLeft) })
                    : t('daysOver', { days: Math.floor(-info.daysLeft) })}
                </ThemedText>
              )}
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              {t('lastDone', { date: date(info.last.date), km: number(info.last.odometerKm) })}
            </ThemedText>
            {info.remindAt && (
              <ThemedText type="small" themeColor="textSecondary">
                {t('reminderOn', { date: date(toDateString(info.remindAt)) })}
              </ThemedText>
            )}
          </>
        )}
      </Card>
    </Pressable>
  );
}

export default function ServiceScreen() {
  const data = useData();
  const { t, number, date } = useI18n();
  const theme = useTheme();

  const history = [...data.maintenance].sort((a, b) => b.date.localeCompare(a.date));

  function confirmRemove(id: string) {
    Alert.alert(t('deleteTitle'), t('deleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => data.removeMaintenance(id) },
    ]);
  }

  return (
    <Screen title={t('serviceTitle')} subtitle={t('serviceSubtitle')}>
      {dueForAll(data).map((info) => (
        <StatusCard key={info.kind} info={info} />
      ))}

      <Button label={t('logService')} icon="add" onPress={() => openAdd()} />

      {history.length > 0 && <SectionTitle>{t('history')}</SectionTitle>}

      {history.map((entry) => (
        <Card key={entry.id} style={styles.row}>
          <IconBadge name={entry.kind} />
          <View style={styles.rowMain}>
            <ThemedText type="smallBold">{t(entry.kind)}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {date(entry.date)} · {number(entry.odometerKm)} km
            </ThemedText>
            {entry.note && <ThemedText type="small">{entry.note}</ThemedText>}
          </View>
          <IconButton icon="trash" color={theme.textSecondary} onPress={() => confirmRemove(entry.id)} />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginBottom: Spacing.one,
  },
  cardTitle: {
    flex: 1,
    fontWeight: 700,
  },
  leftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowMain: {
    flex: 1,
  },
});
