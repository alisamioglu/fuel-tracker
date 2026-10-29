import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';

import { DateField } from '@/components/date-field';
import { Button, Card, Field, FieldRow, Screen } from '@/components/ui';
import { useI18n } from '@/i18n';
import { useData } from '@/lib/data-context';
import { makeId, parseDate, parseNumber, todayString } from '@/lib/format';
import { sortByOdometer } from '@/lib/fuel';

export default function AddFuelScreen() {
  const { fuel, addFuel } = useData();
  const { t, number } = useI18n();

  const [odometer, setOdometer] = useState('');
  const [liters, setLiters] = useState('');
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(todayString());

  const latest = sortByOdometer(fuel).at(-1);

  function save() {
    const odometerKm = parseNumber(odometer);
    const litersValue = parseNumber(liters);
    const totalPrice = parseNumber(price);

    if (!(odometerKm > 0) || !(litersValue > 0) || !(totalPrice > 0)) {
      Alert.alert(t('missingTitle'), t('missingFuel'));
      return;
    }
    if (!parseDate(date)) {
      Alert.alert(t('wrongDateTitle'), t('wrongDateBody', { example: todayString() }));
      return;
    }
    if (fuel.some((e) => e.odometerKm === odometerKm)) {
      Alert.alert(t('duplicateTitle'), t('duplicateBody'));
      return;
    }

    addFuel({ id: makeId(), date, odometerKm, liters: litersValue, totalPrice });
    // The Fuel tab shows the new result in its big card, so I just go back
    router.back();
  }

  return (
    <Screen modal>
      <Card>
        <Field
          label={t('odometer')}
          unit="km"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder={latest ? String(latest.odometerKm + 500) : '17000'}
          hint={latest ? t('lastOdometer', { km: number(latest.odometerKm) }) : t('odometerHint')}
          autoFocus
        />
        <FieldRow>
          <Field
            label={t('liters')}
            unit="L"
            value={liters}
            onChangeText={setLiters}
            keyboardType="decimal-pad"
            placeholder="45"
          />
          <Field
            label={t('totalPrice')}
            unit="TL"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="3000"
          />
        </FieldRow>
        <DateField value={date} onChange={setDate} />
      </Card>
      <Button label={t('save')} icon="check" onPress={save} />
    </Screen>
  );
}
