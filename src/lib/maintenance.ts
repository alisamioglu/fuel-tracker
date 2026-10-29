import { addMonths, daysBetween, parseDate } from './format';
import type { FuelEntry, Interval, MaintenanceEntry, MaintenanceKind } from './types';

export type DueInfo = {
  kind: MaintenanceKind;
  last: MaintenanceEntry | null;
  dueKm: number | null;
  dueDate: Date | null;
  kmLeft: number | null;
  daysLeft: number | null;
  // Best guess of when I should get the reminder (whichever comes first: date or km).
  // Null when that moment is already gone.
  remindAt: Date | null;
  overdue: boolean;
};

export function lastOfKind(entries: MaintenanceEntry[], kind: MaintenanceKind) {
  const ofKind = entries.filter((e) => e.kind === kind);
  if (ofKind.length === 0) return null;
  return ofKind.reduce((latest, e) =>
    e.date > latest.date || (e.date === latest.date && e.odometerKm > latest.odometerKm) ? e : latest,
  );
}

export function currentOdometer(fuel: FuelEntry[], maintenance: MaintenanceEntry[]) {
  const all = [...fuel.map((e) => e.odometerKm), ...maintenance.map((e) => e.odometerKm)];
  return all.length > 0 ? Math.max(...all) : 0;
}

export function getDueInfo(
  kind: MaintenanceKind,
  interval: Interval,
  maintenance: MaintenanceEntry[],
  odometerNow: number,
  kmPerDay: number,
  now = new Date(),
): DueInfo {
  const last = lastOfKind(maintenance, kind);
  const lastDate = last ? parseDate(last.date) : null;
  if (!last || !lastDate) {
    return {
      kind,
      last: null,
      dueKm: null,
      dueDate: null,
      kmLeft: null,
      daysLeft: null,
      remindAt: null,
      overdue: false,
    };
  }

  const dueKm = last.odometerKm + interval.km;
  const dueDate = addMonths(lastDate, interval.months);
  // Reminder goes off at 10 in the morning, nobody wants a 00:00 oil notification
  dueDate.setHours(10, 0, 0, 0);

  const kmLeft = dueKm - odometerNow;
  const daysLeft = daysBetween(now, dueDate);

  let remindAt = dueDate;
  if (kmPerDay > 0 && kmLeft > 0) {
    // If I keep driving at my usual pace, when will I hit the km limit?
    const byKm = new Date(now.getTime() + (kmLeft / kmPerDay) * 24 * 60 * 60 * 1000);
    byKm.setHours(10, 0, 0, 0);
    if (byKm < remindAt) remindAt = byKm;
  }

  return {
    kind,
    last,
    dueKm,
    dueDate,
    kmLeft,
    daysLeft,
    remindAt: remindAt > now ? remindAt : null,
    overdue: kmLeft <= 0 || daysLeft <= 0,
  };
}
