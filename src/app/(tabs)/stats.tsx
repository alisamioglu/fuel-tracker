import { StyleSheet, View } from 'react-native';

import { BarChart, LineChart, type ChartPoint } from '@/components/charts';
import { ThemedText } from '@/components/themed-text';
import {
  Appear,
  Card,
  EmptyState,
  InfoRow,
  Screen,
  SectionTitle,
  StatTile,
  TileGrid,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { getAchievements } from '@/lib/achievements';
import { dueForAll, useData, useFormat } from '@/lib/data-context';
import { getStats } from '@/lib/fuel';

function Badges() {
  const data = useData();
  const { t } = useI18n();
  const theme = useTheme();
  const badges = getAchievements(data.fuel, dueForAll(data));
  const done = badges.filter((b) => b.unlocked).length;

  return (
    <>
      <SectionTitle>{t('badges')}</SectionTitle>
      <ThemedText type="small" themeColor="textSecondary">
        {t('badgesProgress', { done, total: badges.length })}
      </ThemedText>
      <View style={styles.badgeGrid}>
        {badges.map((b, index) => (
          <View key={b.id} style={styles.badgeCell}>
            <Appear index={index}>
              <Card style={[styles.badge, !b.unlocked && styles.locked]}>
                <View
                  style={[
                    styles.badgeCircle,
                    { backgroundColor: b.unlocked ? theme.warningSoft : theme.backgroundSelected },
                  ]}>
                  <ThemedText style={styles.badgeEmoji}>{b.unlocked ? b.emoji : '🔒'}</ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.center} numberOfLines={1}>
                  {t(b.title)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                  {t(b.body)}
                </ThemedText>
              </Card>
            </Appear>
          </View>
        ))}
      </View>
    </>
  );
}

export default function StatsScreen() {
  const { fuel } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const stats = getStats(fuel);

  if (!stats || stats.trips.length === 0) {
    return (
      <Screen title={t('statsTitle')} subtitle={t('statsSubtitle')}>
        <EmptyState icon="stats" title={t('statsTitle')} body={t('statsEmpty')} />
        <Badges />
      </Screen>
    );
  }

  const months = stats.calendarMonths;

  // Last 6 months, oldest on the left
  const spendPoints: ChartPoint[] = stats.months
    .slice(0, 6)
    .reverse()
    .map((m) => ({
      label: format.monthShort(m.month),
      title: format.month(m.month),
      value: m.spend,
      display: format.money(m.spend),
    }));

  // Last 8 full tanks
  const consumptionPoints: ChartPoint[] = stats.trips.slice(-8).map((trip) => ({
    label: format.dateShort(trip.entry.date),
    title: format.date(trip.entry.date),
    value: format.consumptionValue(trip.litersPer100Km),
    display: format.consumption(trip.litersPer100Km),
  }));

  return (
    <Screen title={t('statsTitle')} subtitle={t('statsSubtitle')}>
      <TileGrid>
        <StatTile
          icon="fuel"
          label={t('avgConsumption')}
          value={format.number(format.consumptionValue(stats.avgLitersPer100Km), 1)}
          unit={format.consumptionUnit}
        />
        <StatTile
          icon="money"
          tone="success"
          label={t('costPerKm')}
          value={format.costPerDistance(stats.avgCostPerKm)}
        />
        <StatTile
          icon="road"
          tone="warning"
          label={t('kmPerMonth')}
          value={format.number(format.toDistance(stats.avgKmPerMonth))}
          unit={format.distanceUnit}
        />
        <StatTile
          icon="calendar"
          tone="neutral"
          label={t('spendPerMonth')}
          value={format.money(stats.totalSpend / months, 0)}
        />
      </TileGrid>

      <SectionTitle>{t('spendChart')}</SectionTitle>
      <Card>
        <BarChart points={spendPoints} />
      </Card>

      {consumptionPoints.length >= 2 && (
        <>
          <SectionTitle>{t('consumptionChart')}</SectionTitle>
          <Card>
            <LineChart points={consumptionPoints} />
          </Card>
        </>
      )}

      <Badges />

      <SectionTitle>{t('allTime')}</SectionTitle>
      <Card>
        <InfoRow label={t('distance')} value={format.distance(stats.totalDistanceKm)} />
        <InfoRow label={t('fuel')} value={format.volume(stats.totalLiters)} />
        <InfoRow label={t('fuelPerMonth')} value={format.volume(stats.totalLiters / months)} />
        <InfoRow label={t('spend')} value={format.money(stats.totalSpend)} />
        <InfoRow label={t('fillUps')} value={format.number(fuel.length)} />
      </Card>

      <SectionTitle>{t('byMonth')}</SectionTitle>
      <Card>
        {stats.months.map((m, i) => (
          <View key={m.month} style={[styles.monthRow, i > 0 && styles.monthDivider]}>
            <View style={styles.flex}>
              <ThemedText type="smallBold" style={styles.capitalize}>
                {format.month(m.month)}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {format.distance(m.distanceKm)} · {format.volume(m.liters)} · {t('fillUps')}: {m.fillUps}
              </ThemedText>
            </View>
            <ThemedText type="smallBold">{format.money(m.spend)}</ThemedText>
          </View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  center: {
    textAlign: 'center',
  },
  capitalize: {
    textTransform: 'capitalize',
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.one,
  },
  badgeCell: {
    width: '50%',
    padding: Spacing.one,
  },
  badge: {
    alignItems: 'center',
    gap: Spacing.one,
    minHeight: 150,
  },
  locked: {
    opacity: 0.55,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  badgeEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  monthDivider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,128,128,0.3)',
  },
});
