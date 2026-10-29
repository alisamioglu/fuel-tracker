import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getStats, getTrips, type Trip } from './fuel';
import { currentOdometer, getDueInfo } from './maintenance';
import { ensurePermission, notifyNow, scheduleReminder } from './notifications';
import { loadData, saveFuel, saveIntervals, saveMaintenance, type AppData } from './storage';
import type { FuelEntry, Interval, MaintenanceEntry, MaintenanceKind } from './types';

const KINDS: MaintenanceKind[] = ['oil', 'coolant'];

type DataContextValue = AppData & {
  addFuel: (entry: FuelEntry) => Trip | null;
  removeFuel: (id: string) => void;
  addMaintenance: (entry: MaintenanceEntry) => void;
  removeMaintenance: (id: string) => void;
  setInterval: (kind: MaintenanceKind, interval: Interval) => void;
};

const DataContext = createContext<DataContextValue | null>(null);

export function dueForAll(data: AppData) {
  const odometer = currentOdometer(data.fuel, data.maintenance);
  const kmPerDay = getStats(data.fuel)?.kmPerDay ?? 0;
  return KINDS.map((kind) =>
    getDueInfo(kind, data.intervals[kind], data.maintenance, odometer, kmPerDay),
  );
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    loadData().then(setData);
  }, []);

  // Every time something changes I rebuild the scheduled reminders from scratch
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
  }, [data]);

  // Don't show the screens before the saved data is back, otherwise a quick save could wipe it
  if (!data) return null;
  const current = data;

  function update(next: AppData) {
    setData(next);
    if (next.fuel !== current.fuel) saveFuel(next.fuel);
    if (next.maintenance !== current.maintenance) saveMaintenance(next.maintenance);
    if (next.intervals !== current.intervals) saveIntervals(next.intervals);
  }

  function addFuel(entry: FuelEntry) {
    const next = { ...current, fuel: [...current.fuel, entry] };
    const before = dueForAll(current);
    update(next);

    // If this fill-up pushed me past the oil/coolant km limit, tell me right away
    dueForAll(next).forEach((info, i) => {
      const was = before[i].kmLeft;
      if (info.kmLeft !== null && info.kmLeft <= 0 && was !== null && was > 0) {
        notifyNow(info.kind, -info.kmLeft).catch(() => {});
      }
    });

    return getTrips(next.fuel).get(entry.id) ?? null;
  }

  const value: DataContextValue = {
    ...current,
    addFuel,
    removeFuel: (id) => update({ ...current, fuel: current.fuel.filter((e) => e.id !== id) }),
    addMaintenance: (entry) => update({ ...current, maintenance: [...current.maintenance, entry] }),
    removeMaintenance: (id) =>
      update({ ...current, maintenance: current.maintenance.filter((e) => e.id !== id) }),
    setInterval: (kind, interval) =>
      update({ ...current, intervals: { ...current.intervals, [kind]: interval } }),
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error('useData must be used inside DataProvider');
  return value;
}
