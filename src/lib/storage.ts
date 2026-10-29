import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_INTERVALS, type FuelEntry, type Intervals, type MaintenanceEntry } from './types';

// Everything lives on the phone as JSON, one key per list
const KEYS = {
  fuel: 'fuel-tracker/fuel',
  maintenance: 'fuel-tracker/maintenance',
  intervals: 'fuel-tracker/intervals',
};

export type AppData = {
  fuel: FuelEntry[];
  maintenance: MaintenanceEntry[];
  intervals: Intervals;
};

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
  const [fuel, maintenance, intervals] = await Promise.all([
    readJson<FuelEntry[]>(KEYS.fuel, []),
    readJson<MaintenanceEntry[]>(KEYS.maintenance, []),
    readJson<Intervals>(KEYS.intervals, DEFAULT_INTERVALS),
  ]);
  // Merge with defaults in case I add a new maintenance kind later
  return { fuel, maintenance, intervals: { ...DEFAULT_INTERVALS, ...intervals } };
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
