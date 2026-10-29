import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';

import {
  CURRENCIES,
  DEFAULT_INTERVALS,
  type Currency,
  type FuelEntry,
  type Intervals,
  type MaintenanceEntry,
  type Settings,
} from './types';

// Everything lives on the phone as JSON, one key per list
const KEYS = {
  fuel: 'fuel-tracker/fuel',
  maintenance: 'fuel-tracker/maintenance',
  intervals: 'fuel-tracker/intervals',
  settings: 'fuel-tracker/settings',
};

export type AppData = {
  fuel: FuelEntry[];
  maintenance: MaintenanceEntry[];
  intervals: Intervals;
  settings: Settings;
};

// First start: guess currency and units from the phone's region
function defaultSettings(): Settings {
  const locale = getLocales()[0];
  const currency = CURRENCIES.find((c) => c === locale?.currencyCode) ?? 'EUR';
  return {
    currency: currency as Currency,
    units: locale?.measurementSystem === 'us' ? 'imperial' : 'metric',
    carName: '',
    carEmoji: '🚗',
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.warn(`Could not read ${key}`, error);
    return fallback;
  }
}

export async function loadData(): Promise<AppData> {
  const defaults = defaultSettings();
  const [fuel, maintenance, intervals, settings] = await Promise.all([
    readJson<FuelEntry[]>(KEYS.fuel, []),
    readJson<MaintenanceEntry[]>(KEYS.maintenance, []),
    readJson<Partial<Intervals>>(KEYS.intervals, {}),
    readJson<Partial<Settings>>(KEYS.settings, {}),
  ]);
  // Merging with the defaults so new maintenance kinds and settings just show up
  return {
    fuel,
    maintenance,
    intervals: { ...DEFAULT_INTERVALS, ...intervals },
    settings: { ...defaults, ...settings },
  };
}

export function saveFuel(fuel: FuelEntry[]) {
  return AsyncStorage.setItem(KEYS.fuel, JSON.stringify(fuel));
}

export function saveMaintenance(maintenance: MaintenanceEntry[]) {
  return AsyncStorage.setItem(KEYS.maintenance, JSON.stringify(maintenance));
}

export function saveIntervals(intervals: Intervals) {
  return AsyncStorage.setItem(KEYS.intervals, JSON.stringify(intervals));
}

export function saveSettings(settings: Settings) {
  return AsyncStorage.setItem(KEYS.settings, JSON.stringify(settings));
}
