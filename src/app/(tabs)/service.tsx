import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Appear,
  Button,
  Card,
  EmojiBadge,
  Pill,
  ProgressBar,
  Screen,
  SectionTitle,
  type Tone,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { dueForAll, useData, useFormat } from '@/lib/data-context';
import { toDateString } from '@/lib/format';
import type { DueInfo, DueStatus } from '@/lib/maintenance';
import { KIND_EMOJI, type MaintenanceKind } from '@/lib/types';

const STATUS_TONE: Record<DueStatus, Tone> = {
  none: 'neutral',
  ok: 'success',
  soon: 'warning',
  due: 'danger',
};

// Most urgent first, so the thing I need to do is always at the top
const STATUS_ORDER: Record<DueStatus, number> = { due: 0, soon: 1, ok: 2, none: 3 };

function openAdd(params?: { kind?: MaintenanceKind; id?: string }) {
  router.push(params ? { pathname: '/add-service', params } : '/add-service');
}

function StatusCard({ info }: { info: DueInfo }) {
  const { t } = useI18n();
  const format = useFormat();
  const tone = STATUS_TONE[info.status];
  const statusLabel = { ok: t('statusOk'), soon: t('statusSoon'), due: t('statusDue'), none: '' };
  const last = info.last;
  if (!last) return null;

  return (
    <Pressable onPress={() => openAdd({ kind: info.kind })}>
      {({ pressed }) => (
        <Card style={pressed && styles.pressed}>
          <View style={styles.cardHeader}>
            <EmojiBadge emoji={KIND_EMOJI[info.kind]} tone={tone} />
            <ThemedText type="default" style={styles.cardTitle}>
              {t(info.kind)}
            </ThemedText>
            <Pill label={statusLabel[info.status]} tone={tone} />
          </View>

          <ProgressBar value={info.progress} tone={tone} />
          <View style={styles.leftRow}>
            {info.kmLeft !== null ? (
              <ThemedText type="smallBold">
                {info.kmLeft > 0
                  ? t('kmLeft', { distance: format.distance(info.kmLeft) })
                  : t('kmOver', { distance: format.distance(-info.kmLeft) })}
              </ThemedText>
            ) : (
              <View />
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
            {t('lastDone', {
              date: format.date(last.date),
              distance: format.distance(last.odometerKm),
            })}
          </ThemedText>
          {info.remindAt && (
            <ThemedText type="small" themeColor="textSecondary">
              🔔 {t('reminderOn', { date: format.date(toDateString(info.remindAt)) })}
            </ThemedText>
          )}
        </Card>
      )}
    </Pressable>
  );
}

export default function ServiceScreen() {
  const data = useData();
  const { t } = useI18n();
  const format = useFormat();
  const theme = useTheme();

  const due = dueForAll(data);
  const tracked = due
    .filter((d) => d.status !== 'none')
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || b.progress - a.progress);
  const untracked = due.filter((d) => d.status === 'none');
  const history = [...data.maintenance].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <Screen title={t('serviceTitle')} subtitle={t('serviceSubtitle')}>
      {tracked.map((info, index) => (
        <Appear key={info.kind} index={index}>
          <StatusCard info={info} />
        </Appear>
      ))}

      <Button label={t('logService')} icon="add" onPress={() => openAdd()} />

      {untracked.length > 0 && (
        <>
          <SectionTitle>{t('startTracking')}</SectionTitle>
          <ThemedText type="small" themeColor="textSecondary">
            {t('startTrackingHint')}
          </ThemedText>
          <View style={styles.chipGrid}>
            {untracked.map((info) => (
              <Pressable
                key={info.kind}
                onPress={() => openAdd({ kind: info.kind })}
                style={({ pressed }) => [
                  styles.kindChip,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}>
                <ThemedText style={styles.chipEmoji}>{KIND_EMOJI[info.kind]}</ThemedText>
                <ThemedText type="smallBold">{t(info.kind)}</ThemedText>
              </Pressable>
            ))}
          </View>
        </>
      )}

      {history.length > 0 && <SectionTitle>{t('history')}</SectionTitle>}

      {history.map((entry, index) => (
        <Appear key={entry.id} index={index}>
          <Pressable onPress={() => openAdd({ id: entry.id })}>
            {({ pressed }) => (
              <Card style={[styles.row, pressed && styles.pressed]}>
                <EmojiBadge emoji={KIND_EMOJI[entry.kind]} tone="neutral" />
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{t(entry.kind)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {format.date(entry.date)} · {format.distance(entry.odometerKm)}
                    {entry.place ? ` · ${entry.place}` : ''}
                  </ThemedText>
                  {entry.note && <ThemedText type="small">{entry.note}</ThemedText>}
                </View>
              </Card>
            )}
          </Pressable>
        </Appear>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kindChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipEmoji: {
    fontSize: 18,
    lineHeight: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  pressed: {
    opacity: 0.7,
  },
});
