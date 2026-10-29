import { formatDate, formatNumber, monthLabel } from './format';
import type { Currency, Settings } from './types';

const KM_PER_MILE = 1.609344;
const LITERS_PER_GALLON = 3.785411784;

// Everything the screens need to show numbers in my language, currency and units.
// Data is always km + liters inside, these helpers convert on the way in and out.
export function makeFormatter(language: string, settings: Settings) {
  const imperial = settings.units === 'imperial';
  const number = (value: number, digits = 0) => formatNumber(value, digits, language);

  function money(value: number, digits = 2) {
    try {
      return value.toLocaleString(language, {
        style: 'currency',
        currency: settings.currency,
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
    } catch {
      // Some older Intl builds don't do currencies, so I fall back to a plain symbol
      return `${number(value, digits)} ${CURRENCY_SYMBOLS[settings.currency]}`;
    }
  }

  const distanceUnit = imperial ? 'mi' : 'km';
  const volumeUnit = imperial ? 'gal' : 'L';
  const consumptionUnit = imperial ? 'mpg' : 'L/100 km';

  // US miles per gallon is 235.215 divided by L/100 km
  const consumptionValue = (litersPer100Km: number) =>
    imperial ? (litersPer100Km > 0 ? 235.215 / litersPer100Km : 0) : litersPer100Km;

  return {
    number,
    money,
    date: (text: string) => formatDate(text, language),
    month: (key: string) => monthLabel(key, language),
    monthShort: (key: string) => {
      const [y, m] = key.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString(language, { month: 'short' });
    },
    dateShort: (text: string) => {
      const [y, m, d] = text.split('-').map(Number);
      return new Date(y, m - 1, d).toLocaleDateString(language, { day: 'numeric', month: 'short' });
    },
    distanceUnit,
    volumeUnit,
    consumptionUnit,
    currencySymbol: CURRENCY_SYMBOLS[settings.currency],

    // km -> what I show, and what I typed -> km
    toDistance: (km: number) => (imperial ? km / KM_PER_MILE : km),
    fromDistance: (value: number) => (imperial ? value * KM_PER_MILE : value),
    toVolume: (liters: number) => (imperial ? liters / LITERS_PER_GALLON : liters),
    fromVolume: (value: number) => (imperial ? value * LITERS_PER_GALLON : value),

    distance: (km: number) => `${number(imperial ? km / KM_PER_MILE : km)} ${distanceUnit}`,
    volume: (liters: number) =>
      `${number(imperial ? liters / LITERS_PER_GALLON : liters, 1)} ${volumeUnit}`,
    consumptionValue,
    consumption: (litersPer100Km: number) =>
      `${number(consumptionValue(litersPer100Km), 1)} ${consumptionUnit}`,
    costPerDistance: (costPerKm: number) =>
      `${money(imperial ? costPerKm * KM_PER_MILE : costPerKm)}/${distanceUnit}`,
  };
}

export type Formatter = ReturnType<typeof makeFormatter>;

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TRY: '₺',
  EUR: '€',
  USD: '$',
  GBP: '£',
  RUB: '₽',
};
