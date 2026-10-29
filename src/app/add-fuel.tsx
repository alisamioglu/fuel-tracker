import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { DateField } from '@/components/date-field';
import { ThemedText } from '@/components/themed-text';
import { useToast } from '@/components/toast';
import { Button, Card, Field, FieldRow, Screen, SwitchRow } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useData, useFormat } from '@/lib/data-context';
import { makeId, parseDate, parseNumber, todayString } from '@/lib/format';
import { compareToAverage, getStats, sortByOdometer } from '@/lib/fuel';
import { successFeedback, warningFeedback } from '@/lib/haptics';

// Same screen for a new fill-up and for editing one (when an id comes in)
export default function AddFuelScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { fuel, saveFuelEntry, removeFuel } = useData();
  const { t } = useI18n();
  const format = useFormat();
  const toast = useToast();

  const existing = fuel.find((e) => e.id === id);
  // Numbers go into the fields in my display units, rounded so they look normal
  const [odometer, setOdometer] = useState(
    existing ? String(Math.round(format.toDistance(existing.odometerKm))) : '',
  );
  const [amount, setAmount] = useState(
    existing ? String(Math.round(format.toVolume(existing.liters) * 100) / 100) : '',
  );
  const [price, setPrice] = useState(existing ? String(existing.totalPrice) : '');
  const [date, setDate] = useState(existing?.date ?? todayString());
  const [partial, setPartial] = useState(existing?.partial ?? false);
  const [station, setStation] = useState(existing?.station ?? '');

  const latest = sortByOdometer(fuel.filter((e) => e.id !== id)).at(-1);
  const amountValue = parseNumber(amount);
  const priceValue = parseNumber(price);
  const unitPrice = amountValue > 0 && priceValue > 0 ? priceValue / amountValue : null;

  function save() {
    const odometerKm = format.fromDistance(parseNumber(odometer));
    const liters = format.fromVolume(amountValue);

    if (!(odometerKm > 0) || !(liters > 0) || !(priceValue > 0)) {
      Alert.alert(t('missingTitle'), t('missingFuel'));
      return;
    }
    if (!parseDate(date)) {
      Alert.alert(t('wrongDateTitle'), t('wrongDateBody', { example: todayString() }));
      return;
    }
    if (fuel.some((e) => e.id !== id && Math.abs(e.odometerKm - odometerKm) < 0.5)) {
      Alert.alert(t('duplicateTitle'), t('duplicateBody'));
      return;
    }

    const entry = {
      id: existing?.id ?? makeId(),
      date,
      odometerKm,
      liters,
      totalPrice: priceValue,
      partial: partial || undefined,
      station: station.trim() || undefined,
    };
    const { trip, newBadges } = saveFuelEntry(entry);
    successFeedback();

    // A little cheer, depending on what just happened
    if (existing) {
      toast({ emoji: '✏️', title: t('toastUpdated') });
    } else if (partial) {
      toast({ emoji: '💧', title: t('toastPartial'), body: t('toastPartialBody') });
    } else if (trip) {
      const nextStats = getStats([...fuel, entry]);
      const diff = compareToAverage(trip, nextStats);
      const emoji = diff === null ? '🎉' : diff <= -3 ? '🌱' : diff >= 3 ? '🔥' : '👌';
      toast({
        emoji,
        title: t('toastSaved'),
        body: `${format.consumption(trip.litersPer100Km)} · ${format.distance(trip.distanceKm)}`,
      });
    } else {
      toast({ emoji: '🚀', title: t('toastSaved'), body: t('toastFirst') });
    }
    newBadges.forEach((badge) =>
      toast({ emoji: badge.emoji, title: t('toastBadge', { name: t(badge.title) }), body: t(badge.body) }),
    );

    router.back();
  }

  function remove() {
    if (!existing) return;
    Alert.alert(t('deleteTitle'), t('deleteBody'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => {
          removeFuel(existing.id);
          warningFeedback();
          router.back();
        },
      },
    ]);
  }

  return (
    <Screen modal>
      <Stack.Screen options={{ title: existing ? t('editFillUp') : t('newFillUp') }} />
      <Card>
        <Field
          label={t('odometer')}
          unit={format.distanceUnit}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder={latest ? String(Math.round(format.toDistance(latest.odometerKm)) + 500) : '17000'}
          hint={
            existing
              ? undefined
              : latest
                ? t('lastOdometer', { distance: format.distance(latest.odometerKm) })
                : t('odometerHint')
          }
          autoFocus={!existing}
        />
        <FieldRow>
          <Field
            label={t('liters')}
            unit={format.volumeUnit}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="45"
          />
          <Field
            label={t('totalPrice')}
            unit={format.currencySymbol}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="3000"
          />
        </FieldRow>
        {unitPrice !== null && (
          <ThemedText type="small" themeColor="textSecondary">
            💡 {t('pricePerUnit', { price: format.money(unitPrice), unit: format.volumeUnit })}
          </ThemedText>
        )}
        <DateField value={date} onChange={setDate} />
      </Card>

      <Card>
        <SwitchRow
          label={t('partialFill')}
          hint={t('partialHint')}
          value={partial}
          onChange={setPartial}
        />
        <Field
          label={t('station')}
          value={station}
          onChangeText={setStation}
          placeholder={t('stationPlaceholder')}
        />
      </Card>

      <Button label={t('save')} icon="check" onPress={save} />
      {existing && <Button label={t('deleteEntry')} icon="trash" variant="danger" onPress={remove} />}
    </Screen>
  );
}
