import { router } from 'expo-router';
import { Alert, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  Button,
  Card,
  EmptyState,
  IconBadge,
  IconButton,
  Screen,
  SectionTitle,
} from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import { useData } from '@/lib/data-context';
import { getTrips, sortByOdometer } from '@/lib/fuel';

export default function FuelScreen() {
  const { fuel, removeFuel } = useData();
  const { t, number, money, date } = useI18n();
  const theme = useTheme();

  const sorted = sortByOdometer(fuel);
  const trips = getTrips(fuel);
  const latest = sorted[sorted.length - 1];
  const latestTrip = latest ? trips.get(latest.id) : undefined;

  function confirmRemove(id: string) {
    Alert.alert(t('deleteTitle'), t('deleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: () => removeFuel(id) },
    ]);
  }

  return (
    <Screen title={t('fuelTitle')} subtitle={t('fuelSubtitle')}>
      {latestTrip && (
        // The big blue card: the one thing I want to see after every fill-up
        <View style={[styles.hero, { backgroundColor: theme.primary }]}>
          <ThemedText type="smallBold" style={styles.heroLabel}>
            {t('sinceLastFillUp')}
          </ThemedText>
          <View style={styles.heroValueRow}>
            <ThemedText style={styles.heroValue}>{number(latestTrip.litersPer100Km, 1)}</ThemedText>
            <ThemedText type="smallBold" style={styles.heroUnit}>
              L/100 km
            </ThemedText>
          </View>
          <ThemedText style={styles.heroText}>
            {t('drove', {
              km: number(latestTrip.distanceKm),
              liters: number(latestTrip.entry.liters, 1),
            })}
          </ThemedText>
          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <ThemedText type="small" style={styles.heroLabel}>
                {t('distance')}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.heroText}>
                {number(latestTrip.distanceKm)} km
              </ThemedText>
            </View>
            <View style={styles.heroStat}>
              <ThemedText type="small" style={styles.heroLabel}>
                {t('costPerKm')}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.heroText}>
                {money(latestTrip.costPerKm)}
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {fuel.length === 0 && (
        <EmptyState icon="fuel" title={t('fuelEmptyTitle')} body={t('fuelEmptyBody')} />
      )}

      {fuel.length === 1 && (
        <Card>
          <ThemedText type="small" themeColor="textSecondary">
            {t('fuelOneEntry')}
          </ThemedText>
        </Card>
      )}

      <Button label={t('addFillUp')} icon="add" onPress={() => router.push('/add-fuel')} />

      {fuel.length > 0 && <SectionTitle>{t('history')}</SectionTitle>}

      {[...sorted].reverse().map((entry) => {
        const trip = trips.get(entry.id);
        return (
          <Card key={entry.id} style={styles.row}>
            <IconBadge name="fuel" />
            <View style={styles.rowMain}>
              <ThemedText type="smallBold">{date(entry.date)}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {number(entry.odometerKm)} km · {number(entry.liters, 1)} L
              </ThemedText>
            </View>
            <View style={styles.rowEnd}>
              <ThemedText type="smallBold">{money(entry.totalPrice)}</ThemedText>
              <ThemedText type="small" themeColor={trip ? 'text' : 'textSecondary'}>
                {trip ? `${number(trip.litersPer100Km, 1)} L/100` : t('firstFillUp')}
              </ThemedText>
            </View>
            <IconButton icon="trash" color={theme.textSecondary} onPress={() => confirmRemove(entry.id)} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.one,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.8)',
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: Spacing.two,
  },
  heroValue: {
    color: '#ffffff',
    fontSize: 48,
    lineHeight: 56,
    fontWeight: 700,
  },
  heroUnit: {
    color: 'rgba(255,255,255,0.9)',
  },
  heroText: {
    color: '#ffffff',
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  heroStat: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowMain: {
    flex: 1,
  },
  rowEnd: {
    alignItems: 'flex-end',
  },
});
