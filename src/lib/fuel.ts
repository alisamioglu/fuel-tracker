import { daysBetween, parseDate, toDateString } from './format';
import type { FuelEntry } from './types';

// I use the "full tank" method: when I fill to full, everything I put in since the
// previous full tank (partial fill-ups included) is what the car burned on that stretch.
export type Trip = {
  entry: FuelEntry;
  distanceKm: number;
  liters: number;
  cost: number;
  litersPer100Km: number;
  costPerKm: number;
};

export type MonthTotals = {
  month: string; // 'YYYY-MM'
  liters: number;
  spend: number;
  distanceKm: number;
  fillUps: number;
};

export type FuelStats = {
  totalDistanceKm: number;
  totalLiters: number;
  totalSpend: number;
  avgKmPerMonth: number;
  avgLitersPer100Km: number;
  avgCostPerKm: number;
  kmPerDay: number;
  // Calendar months from the first to the last fill-up, counting both ends
  calendarMonths: number;
  months: MonthTotals[];
  trips: Trip[];
};

const DAYS_PER_MONTH = 30.44;

function calendarMonthsBetween(from: string, to: string) {
  const [fy, fm] = from.split('-').map(Number);
  const [ty, tm] = to.split('-').map(Number);
  return Math.max((ty - fy) * 12 + (tm - fm) + 1, 1);
}

export function sortByOdometer(entries: FuelEntry[]): FuelEntry[] {
  return [...entries].sort((a, b) => a.odometerKm - b.odometerKm);
}

// Trip info for every full fill-up that has an earlier full fill-up to compare with
export function getTrips(entries: FuelEntry[]): Map<string, Trip> {
  const trips = new Map<string, Trip>();
  let lastFull: FuelEntry | null = null;
  let liters = 0;
  let cost = 0;

  for (const entry of sortByOdometer(entries)) {
    liters += entry.liters;
    cost += entry.totalPrice;
    if (entry.partial) continue;

    if (lastFull) {
      const distanceKm = entry.odometerKm - lastFull.odometerKm;
      if (distanceKm > 0) {
        trips.set(entry.id, {
          entry,
          distanceKm,
          liters,
          cost,
          litersPer100Km: (liters / distanceKm) * 100,
          costPerKm: cost / distanceKm,
        });
      }
    }
    // A new stretch starts at this full tank
    lastFull = entry;
    liters = 0;
    cost = 0;
  }
  return trips;
}

export function getStats(entries: FuelEntry[]): FuelStats | null {
  const sorted = sortByOdometer(entries);
  if (sorted.length === 0) return null;

  const trips = [...getTrips(sorted).values()];
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const totalDistanceKm = last.odometerKm - first.odometerKm;
  // Averages only use complete stretches, the first tank and an open partial tail don't count
  const tripDistance = trips.reduce((sum, t) => sum + t.distanceKm, 0);
  const tripLiters = trips.reduce((sum, t) => sum + t.liters, 0);
  const tripSpend = trips.reduce((sum, t) => sum + t.cost, 0);

  const firstDate = parseDate(first.date);
  const lastDate = parseDate(last.date);
  const days = firstDate && lastDate ? Math.max(daysBetween(firstDate, lastDate), 0) : 0;
  // Less than a month of data counts as one month, otherwise the average explodes
  const monthsSpan = Math.max(days / DAYS_PER_MONTH, 1);

  const byMonth = new Map<string, MonthTotals>();
  for (const entry of sorted) {
    const month = entry.date.slice(0, 7);
    const totals = byMonth.get(month) ?? { month, liters: 0, spend: 0, distanceKm: 0, fillUps: 0 };
    totals.liters += entry.liters;
    totals.spend += entry.totalPrice;
    totals.fillUps += 1;
    byMonth.set(month, totals);
  }
  for (const trip of trips) {
    const totals = byMonth.get(trip.entry.date.slice(0, 7));
    if (totals) totals.distanceKm += trip.distanceKm;
  }

  return {
    totalDistanceKm,
    totalLiters: sorted.reduce((sum, e) => sum + e.liters, 0),
    totalSpend: sorted.reduce((sum, e) => sum + e.totalPrice, 0),
    avgKmPerMonth: totalDistanceKm / monthsSpan,
    avgLitersPer100Km: tripDistance > 0 ? (tripLiters / tripDistance) * 100 : 0,
    avgCostPerKm: tripDistance > 0 ? tripSpend / tripDistance : 0,
    // Only trust the daily pace after at least a week of data
    kmPerDay: days >= 7 ? totalDistanceKm / days : 0,
    calendarMonths: calendarMonthsBetween(first.date, last.date),
    months: [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)),
    trips,
  };
}

// How much better (negative) or worse (positive) a trip was than my average, in percent
export function compareToAverage(trip: Trip, stats: FuelStats | null): number | null {
  if (!stats || stats.trips.length < 2 || stats.avgLitersPer100Km <= 0) return null;
  return ((trip.litersPer100Km - stats.avgLitersPer100Km) / stats.avgLitersPer100Km) * 100;
}

export type MonthComparison = {
  thisMonth: number;
  lastMonth: number;
  // null when there is nothing to compare with
  changePercent: number | null;
};

export function compareMonths(entries: FuelEntry[], now = new Date()): MonthComparison {
  const thisKey = toDateString(now).slice(0, 7);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastKey = toDateString(prev).slice(0, 7);

  const spendIn = (key: string) =>
    entries.filter((e) => e.date.startsWith(key)).reduce((sum, e) => sum + e.totalPrice, 0);

  const thisMonth = spendIn(thisKey);
  const lastMonth = spendIn(lastKey);
  return {
    thisMonth,
    lastMonth,
    changePercent: lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : null,
  };
}
