import { Card, InfoRow, Screen } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { useData } from '@/lib/data-context';
import { formatMoney, formatNumber, monthLabel } from '@/lib/format';
import { getStats } from '@/lib/fuel';

export default function StatsScreen() {
  const { fuel } = useData();
  const stats = getStats(fuel);

  if (!stats || fuel.length < 2) {
    return (
      <Screen title="Statistics">
        <ThemedText type="small" themeColor="textSecondary">
          Log at least two fill-ups to see your averages.
        </ThemedText>
      </Screen>
    );
  }

  const monthCount = stats.calendarMonths;

  return (
    <Screen title="Statistics">
      <Card title="Averages">
        <InfoRow label="Km per month" value={`${formatNumber(stats.avgKmPerMonth)} km`} />
        <InfoRow label="Consumption" value={`${formatNumber(stats.avgLitersPer100Km, 1)} L/100 km`} />
        <InfoRow label="Cost per km" value={formatMoney(stats.avgCostPerKm)} />
        <InfoRow
          label="Fuel per month"
          value={`${formatNumber(stats.totalLiters / monthCount, 1)} L`}
        />
        <InfoRow label="Spend per month" value={formatMoney(stats.totalSpend / monthCount)} />
      </Card>

      <Card title="All time">
        <InfoRow label="Distance" value={`${formatNumber(stats.totalDistanceKm)} km`} />
        <InfoRow label="Fuel" value={`${formatNumber(stats.totalLiters, 1)} L`} />
        <InfoRow label="Spend" value={formatMoney(stats.totalSpend)} />
        <InfoRow label="Fill-ups" value={String(fuel.length)} />
      </Card>

      <ThemedText type="smallBold" themeColor="textSecondary">
        By month
      </ThemedText>

      {stats.months.map((m) => (
        <Card key={m.month} title={monthLabel(m.month)}>
          <InfoRow label="Distance" value={`${formatNumber(m.distanceKm)} km`} />
          <InfoRow label="Fuel" value={`${formatNumber(m.liters, 1)} L`} />
          <InfoRow label="Spend" value={formatMoney(m.spend)} />
          <InfoRow label="Fill-ups" value={String(m.fillUps)} />
        </Card>
      ))}
    </Screen>
  );
}
