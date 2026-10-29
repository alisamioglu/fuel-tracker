import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Card, Field, FieldRow, InfoRow, Screen } from '@/components/form';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useData } from '@/lib/data-context';
import {
  formatDate,
  formatMoney,
  formatNumber,
  makeId,
  parseDate,
  parseNumber,
  todayString,
} from '@/lib/format';
import { getTrips, sortByOdometer, type Trip } from '@/lib/fuel';

function tripSentence(trip: Trip) {
  return `You drove ${formatNumber(trip.distanceKm)} km on ${formatNumber(trip.entry.liters, 1)} liters.`;
}

export default function FuelScreen() {
  const { fuel, addFuel, removeFuel } = useData();
  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayString());
  const [lastResult, setLastResult] = useState<Trip | null>(null);

  const sorted = sortByOdometer(fuel);
  const latest = sorted[sorted.length - 1];
  const trips = getTrips(fuel);

  function handleAdd() {
    const odometerKm = parseNumber(odometer);
    const litersValue = parseNumber(liters);
    const totalPrice = parseNumber(price);

    if (!(odometerKm > 0) || !(litersValue > 0) || !(totalPrice > 0)) {
      Alert.alert('Missing info', 'Please enter odometer km, liters and total price.');
      return;
    }
    if (!parseDate(date)) {
      Alert.alert('Wrong date', 'Please write the date like 2026-10-29.');
      return;
    }
    if (fuel.some((e) => e.odometerKm === odometerKm)) {
      Alert.alert('Already logged', 'There is already a fill-up with this odometer value.');
      return;
    }

    const trip = addFuel({
      id: makeId(),
      date,
      odometerKm,
      liters: litersValue,
      totalPrice,
    });
    setLastResult(trip);
    setOdometer('');
    setLiters('');
    setPrice('');
    setDate(todayString());
  }

  function confirmRemove(id: string) {
    Alert.alert('Delete fill-up?', 'This entry will be removed for good.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeFuel(id) },
    ]);
  }

  return (
    <Screen title="Fuel log">
      <Card title="New fill-up">
        <FieldRow>
          <Field
            label="Odometer (km)"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            placeholder={latest ? `> ${latest.odometerKm}` : 'e.g. 17000'}
          />
          <Field label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </FieldRow>
        <FieldRow>
          <Field
            label="Liters"
            value={liters}
            onChangeText={setLiters}
            keyboardType="decimal-pad"
            placeholder="e.g. 45"
          />
          <Field
            label="Total price (TL)"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="e.g. 3000"
          />
        </FieldRow>
        <Button label="Add fill-up" onPress={handleAdd} />
      </Card>

      {lastResult && (
        <Card title="Since your last fill-up">
          <ThemedText>{tripSentence(lastResult)}</ThemedText>
          <InfoRow label="Consumption" value={`${formatNumber(lastResult.litersPer100Km, 1)} L/100 km`} />
          <InfoRow label="Cost per km" value={formatMoney(lastResult.costPerKm)} />
          <Button label="Hide" variant="plain" onPress={() => setLastResult(null)} />
        </Card>
      )}

      <ThemedText type="smallBold" themeColor="textSecondary">
        History ({fuel.length})
      </ThemedText>

      {fuel.length === 0 && (
        <ThemedText type="small" themeColor="textSecondary">
          No fill-ups yet. Fill the tank to full, then log it here. From the second entry on you
          will see your consumption.
        </ThemedText>
      )}

      {[...sorted].reverse().map((entry) => {
        const trip = trips.get(entry.id);
        return (
          <Card key={entry.id}>
            <View style={styles.entryHeader}>
              <ThemedText type="smallBold">{formatDate(entry.date)}</ThemedText>
              <ThemedText type="small">{formatNumber(entry.odometerKm)} km</ThemedText>
            </View>
            <InfoRow
              label={`${formatNumber(entry.liters, 1)} L`}
              value={formatMoney(entry.totalPrice)}
            />
            {trip ? (
              <>
                <ThemedText type="small">{tripSentence(trip)}</ThemedText>
                <InfoRow
                  label="Consumption"
                  value={`${formatNumber(trip.litersPer100Km, 1)} L/100 km`}
                />
                <InfoRow label="Cost per km" value={formatMoney(trip.costPerKm)} />
              </>
            ) : (
              <ThemedText type="small" themeColor="textSecondary">
                First fill-up, nothing to compare with yet.
              </ThemedText>
            )}
            <Button label="Delete" variant="danger" onPress={() => confirmRemove(entry.id)} />
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
});
