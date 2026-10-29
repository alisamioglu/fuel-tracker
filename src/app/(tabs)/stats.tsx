import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Card,
  EmptyState,
  InfoRow,
  ProgressBar,
  Screen,
  SectionTitle,
  StatTile,
  TileGrid,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useI18n } from '@/i18n';
import { useData } from '@/lib/data-context';
import { getStats } from '@/lib/fuel';

export default function StatsScreen() {
  const { fuel } = useData();
  const { t, number, money, month } = useI18n();
  const stats = getStats(fuel);

  if (!stats || fuel.length < 2) {
    return (
      <Screen title={t('statsTitle')} subtitle={t('statsSubtitle')}>
        <EmptyState icon="stats" title={t('statsTitle')} body={t('statsEmpty')} />
      </Screen>
    );
  }

  const months = stats.calendarMonths;
  // The month bars are scaled against the most expensive month
  const maxSpend = Math.max(...stats.months.map((m) => m.spend), 1);

  return (
    <Screen title={t('statsTitle')} subtitle={t('statsSubtitle')}>
      <TileGrid>
        <StatTile
          icon="fuel"
          label={t('avgConsumption')}
          value={number(stats.avgLitersPer100Km, 1)}
          unit="L/100"
        />
        <StatTile icon="money" tone="success" label={t('costPerKm')} value={money(stats.avgCostPerKm)} />
        <StatTile
          icon="road"
          tone="warning"
          label={t('kmPerMonth')}
          value={number(stats.avgKmPerMonth)}
          unit="km"
        />
        <StatTile
          icon="calendar"
          tone="neutral"
          label={t('spendPerMonth')}
          value={money(stats.totalSpend / months)}
        />
      </TileGrid>

      <Card>
        <InfoRow label={t('fuelPerMonth')} value={`${number(stats.totalLiters / months, 1)} L`} />
      </Card>

      <SectionTitle>{t('allTime')}</SectionTitle>
      <Card>
        <InfoRow label={t('distance')} value={`${number(stats.totalDistanceKm)} km`} />
        <InfoRow label={t('fuel')} value={`${number(stats.totalLiters, 1)} L`} />
        <InfoRow label={t('spend')} value={money(stats.totalSpend)} />
        <InfoRow label={t('fillUps')} value={number(fuel.length)} />
      </Card>

      <SectionTitle>{t('byMonth')}</SectionTitle>
      {stats.months.map((m) => (
        <Card key={m.month}>
          <View style={styles.monthHeader}>
            <ThemedText type="smallBold" style={styles.capitalize}>
              {month(m.month)}
            </ThemedText>
            <ThemedText type="smallBold">{money(m.spend)}</ThemedText>
          </View>
          <ProgressBar value={m.spend / maxSpend} tone="primary" />
          <ThemedText type="small" themeColor="textSecondary">
            {number(m.distanceKm)} km · {number(m.liters, 1)} L · {t('fillUps')}: {m.fillUps}
          </ThemedText>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  capitalize: {
    textTransform: 'capitalize',
  },
});
