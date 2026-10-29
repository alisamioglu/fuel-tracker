import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Appear, Button, Card, EmojiBadge, EmptyState, Pill, Screen, SectionTitle } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';
import type { TranslationKey } from '@/i18n/locales/en';
import { useData, useFormat } from '@/lib/data-context';
import { partOfDay } from '@/lib/format';
import { compareMonths, compareToAverage, getStats, getTrips, sortByOdometer } from '@/lib/fuel';

function openEntry(id?: string) {
  router.push(id ? { pathname: '/add-fuel', params: { id } } : '/add-fuel');
}

function EcoLine({ percent }: { percent: number | null }) {
  const { t } = useI18n();
  if (percent === null) return null;
  const rounded = Math.round(Math.abs(percent));
  const text =
    rounded < 3
      ? t('ecoSame')
      : percent < 0
        ? t('ecoBetter', { percent: rounded })
        : t('ecoWorse', { percent: rounded });
  return (
    <View style={styles.ecoPill}>
      <ThemedText type="smallBold" style={styles.heroText}>
        {text}
      </ThemedText>
    </View>
  );
}

function MonthCard() {
  const { fuel } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const theme = useTheme();
  const { thisMonth, changePercent } = compareMonths(fuel);

  let line = t('monthNoCompare');
  let color: string = theme.textSecondary;
  if (changePercent !== null) {
    const rounded = Math.round(Math.abs(changePercent));
    // Spending less is the good direction here
    line = changePercent <= 0 ? `↓ ${t('monthLess', { percent: rounded })}` : `↑ ${t('monthMore', { percent: rounded })}`;
    color = changePercent <= 0 ? theme.success : theme.warning;
  }

  return (
    <Card style={styles.monthCard}>
      <EmojiBadge emoji="📆" tone="neutral" />
      <View style={styles.flex}>
        <ThemedText type="small" themeColor="textSecondary">
          {t('thisMonth')}
        </ThemedText>
        <ThemedText style={styles.monthValue}>{format.money(thisMonth)}</ThemedText>
        <ThemedText type="smallBold" style={{ color }}>
          {line}
        </ThemedText>
      </View>
    </Card>
  );
}

export default function FuelScreen() {
  const { fuel, settings } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const theme = useTheme();

  const sorted = sortByOdometer(fuel);
  const trips = getTrips(fuel);
  const stats = getStats(fuel);
  const latestTrip = stats?.trips.at(-1);

  const greeting = t(`greet_${partOfDay()}` as TranslationKey);
  const title = `${settings.carEmoji} ${settings.carName || t('myCar')}`;

  return (
    <Screen title={title} subtitle={`${greeting} 👋`}>
      {latestTrip && (
        // The big blue card: the one thing I want to see after every fill-up
        <Appear>
          <View style={[styles.hero, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.heroDeco}>⛽</ThemedText>
            <ThemedText type="smallBold" style={styles.heroLabel}>
              {t('sinceLastFillUp')}
            </ThemedText>
            <View style={styles.heroValueRow}>
              <ThemedText style={styles.heroValue}>
                {format.number(format.consumptionValue(latestTrip.litersPer100Km), 1)}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.heroUnit}>
                {format.consumptionUnit}
              </ThemedText>
            </View>
            <ThemedText style={styles.heroText}>
              {t('drove', {
                distance: format.distance(latestTrip.distanceKm),
                volume: format.volume(latestTrip.liters),
              })}
            </ThemedText>
            <EcoLine percent={compareToAverage(latestTrip, stats)} />
            <View style={styles.heroStats}>
              <View style={styles.flex}>
                <ThemedText type="small" style={styles.heroLabel}>
                  {t('distance')}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.heroText}>
                  {format.distance(latestTrip.distanceKm)}
                </ThemedText>
              </View>
              <View style={styles.flex}>
                <ThemedText type="small" style={styles.heroLabel}>
                  {t('costPerKm')}
                </ThemedText>
                <ThemedText type="smallBold" style={styles.heroText}>
                  {format.costPerDistance(latestTrip.costPerKm)}
                </ThemedText>
              </View>
            </View>
          </View>
        </Appear>
      )}

      {fuel.length === 0 && (
        <EmptyState icon="fuel" title={t('fuelEmptyTitle')} body={t('fuelEmptyBody')} />
      )}

      {fuel.length > 0 && !latestTrip && (
        <Card style={styles.monthCard}>
          <EmojiBadge emoji="🚀" />
          <ThemedText type="small" style={styles.flex}>
            {t('fuelOneEntry')}
          </ThemedText>
        </Card>
      )}

      <Button label={t('addFillUp')} icon="add" onPress={() => openEntry()} />

      {fuel.length > 0 && <MonthCard />}

      {fuel.length > 0 && <SectionTitle>{t('history')}</SectionTitle>}

      {[...sorted].reverse().map((entry, index) => {
        const trip = trips.get(entry.id);
        return (
          <Appear key={entry.id} index={index}>
            <Pressable onPress={() => openEntry(entry.id)}>
              {({ pressed }) => (
                <Card style={[styles.row, pressed && styles.pressed]}>
                  <EmojiBadge emoji={entry.partial ? '💧' : '⛽'} tone={entry.partial ? 'neutral' : 'primary'} />
                  <View style={styles.flex}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {format.date(entry.date)}
                      {entry.station ? ` · ${entry.station}` : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {format.distance(entry.odometerKm)} · {format.volume(entry.liters)}
                    </ThemedText>
                  </View>
                  <View style={styles.rowEnd}>
                    <ThemedText type="smallBold">{format.money(entry.totalPrice)}</ThemedText>
                    {entry.partial ? (
                      <Pill label={t('partialBadge')} tone="neutral" />
                    ) : (
                      <ThemedText type="small" themeColor={trip ? 'text' : 'textSecondary'}>
                        {trip ? format.consumption(trip.litersPer100Km) : t('firstFillUp')}
                      </ThemedText>
                    )}
                  </View>
                </Card>
              )}
            </Pressable>
          </Appear>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  hero: {
    borderRadius: 24,
    padding: Spacing.four,
    gap: Spacing.one,
    overflow: 'hidden',
  },
  heroDeco: {
    position: 'absolute',
    right: -10,
    top: -6,
    fontSize: 110,
    lineHeight: 130,
    opacity: 0.14,
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
    fontSize: 52,
    lineHeight: 60,
    fontWeight: 800,
  },
  heroUnit: {
    color: 'rgba(255,255,255,0.9)',
  },
  heroText: {
    color: '#ffffff',
  },
  ecoPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    marginTop: Spacing.two,
  },
  heroStats: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.three,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.4)',
  },
  monthCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  monthValue: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: 700,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  rowEnd: {
    alignItems: 'flex-end',
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.7,
  },
});
