import { daysBetween, parseDate } from './format';
import type { FuelEntry } from './types';

// I use the "full tank" method: the liters I put in now are what the car burned
// since the previous fill-up, so the trip is always (previous entry -> this entry).
export type Trip = {
  entry: FuelEntry;
  distanceKm: number;
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

export function makeTrip(previous: FuelEntry, entry: FuelEntry): Trip | null {
  const distanceKm = entry.odometerKm - previous.odometerKm;
  if (distanceKm <= 0) return null;
  return {
    entry,
    distanceKm,
    litersPer100Km: (entry.liters / distanceKm) * 100,
    costPerKm: entry.totalPrice / distanceKm,
  };
}

// Trip info for every entry except the very first one (nothing to compare it with)
export function getTrips(entries: FuelEntry[]): Map<string, Trip> {
  const sorted = sortByOdometer(entries);
  const trips = new Map<string, Trip>();
  for (let i = 1; i < sorted.length; i++) {
    const trip = makeTrip(sorted[i - 1], sorted[i]);
    if (trip) trips.set(sorted[i].id, trip);
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
  // The first fill-up only "opens" the tank, so its liters and money don't belong to any trip
  const tripLiters = trips.reduce((sum, t) => sum + t.entry.liters, 0);
  const tripSpend = trips.reduce((sum, t) => sum + t.entry.totalPrice, 0);

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
    avgLitersPer100Km: totalDistanceKm > 0 ? (tripLiters / totalDistanceKm) * 100 : 0,
    avgCostPerKm: totalDistanceKm > 0 ? tripSpend / totalDistanceKm : 0,
    // Only trust the daily pace after at least a week of data
    kmPerDay: days >= 7 ? totalDistanceKm / days : 0,
    calendarMonths: calendarMonthsBetween(first.date, last.date),
    months: [...byMonth.values()].sort((a, b) => b.month.localeCompare(a.month)),
  };
}
