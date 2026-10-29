import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getActiveLanguage, useI18n } from '@/i18n';

import { getAchievements, type Achievement } from './achievements';
import { getStats, getTrips, type Trip } from './fuel';
import { currentOdometer, getDueInfo } from './maintenance';
import { ensurePermission, notifyNow, scheduleReminder } from './notifications';
import {
  loadData,
  saveFuel,
  saveIntervals,
  saveMaintenance,
  saveSettings,
  type AppData,
} from './storage';
import {
  MAINTENANCE_KINDS,
  type FuelEntry,
  type Interval,
  type MaintenanceEntry,
  type MaintenanceKind,
  type Settings,
} from './types';
import { makeFormatter } from './units';

// What a screen gets back after saving a fill-up, so it can cheer a little
export type FuelSaveResult = {
  trip: Trip | null;
  newBadges: Achievement[];
};

type DataContextValue = AppData & {
  saveFuelEntry: (entry: FuelEntry) => FuelSaveResult;
  removeFuel: (id: string) => void;
  saveMaintenanceEntry: (entry: MaintenanceEntry) => void;
  removeMaintenance: (id: string) => void;
  setInterval: (kind: MaintenanceKind, interval: Interval) => void;
  updateSettings: (changes: Partial<Settings>) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function dueForAll(data: AppData) {
  const odometer = currentOdometer(data.fuel, data.maintenance);
  const kmPerDay = getStats(data.fuel)?.kmPerDay ?? 0;
  return MAINTENANCE_KINDS.map((kind) =>
    getDueInfo(kind, data.intervals[kind], data.maintenance, odometer, kmPerDay),
  );
}

function badgesOf(data: AppData) {
  return getAchievements(data.fuel, dueForAll(data));
}

// Adds a new entry or replaces the one with the same id (that's how editing works)
function upsert<T extends { id: string }>(list: T[], item: T) {
  return list.some((x) => x.id === item.id)
    ? list.map((x) => (x.id === item.id ? item : x))
    : [...list, item];
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);
  const { language } = useI18n();

  useEffect(() => {
    loadData().then(setData);
  }, []);

  // Every time something changes I rebuild the scheduled reminders from scratch
  // (language too, so the notification text matches the app)
  useEffect(() => {
    if (!data || data.maintenance.length === 0) return;
    (async () => {
      try {
        if (!(await ensurePermission())) return;
        for (const info of dueForAll(data)) {
          await scheduleReminder(info);
        }
      } catch (error) {
        console.warn('Could not schedule reminders', error);
      }
    })();
  }, [data, language]);

  // Don't show the screens before the saved data is back, otherwise a quick save could wipe it
  if (!data) return null;
  const current = data;

  function update(next: AppData) {
    setData(next);
    if (next.fuel !== current.fuel) saveFuel(next.fuel);
    if (next.maintenance !== current.maintenance) saveMaintenance(next.maintenance);
    if (next.intervals !== current.intervals) saveIntervals(next.intervals);
    if (next.settings !== current.settings) saveSettings(next.settings);
  }

  function saveFuelEntry(entry: FuelEntry): FuelSaveResult {
    const next = { ...current, fuel: upsert(current.fuel, entry) };
    const dueBefore = dueForAll(current);
    const badgesBefore = badgesOf(current);
    update(next);

    // If this fill-up pushed me past a km limit, tell me right away
    const format = makeFormatter(getActiveLanguage(), current.settings);
    dueForAll(next).forEach((info, i) => {
      const was = dueBefore[i].kmLeft;
      if (info.kmLeft !== null && info.kmLeft <= 0 && was !== null && was > 0) {
        notifyNow(info.kind, format.distance(-info.kmLeft)).catch(() => {});
      }
    });

    const unlockedBefore = new Set(badgesBefore.filter((b) => b.unlocked).map((b) => b.id));
    return {
      trip: getTrips(next.fuel).get(entry.id) ?? null,
      newBadges: badgesOf(next).filter((b) => b.unlocked && !unlockedBefore.has(b.id)),
    };
  }

  const value: DataContextValue = {
    ...current,
    saveFuelEntry,
    removeFuel: (id) => update({ ...current, fuel: current.fuel.filter((e) => e.id !== id) }),
    saveMaintenanceEntry: (entry) =>
      update({ ...current, maintenance: upsert(current.maintenance, entry) }),
    removeMaintenance: (id) =>
      update({ ...current, maintenance: current.maintenance.filter((e) => e.id !== id) }),
    setInterval: (kind, interval) =>
      update({ ...current, intervals: { ...current.intervals, [kind]: interval } }),
    updateSettings: (changes) =>
      update({ ...current, settings: { ...current.settings, ...changes } }),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}

// Formatting that follows my language, currency and units
export function useFormat() {
  const { language } = useI18n();
  const { settings } = useData();
  return makeFormatter(language, settings);
}
