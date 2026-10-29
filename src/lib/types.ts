// Dates are stored as plain 'YYYY-MM-DD' strings so they don't shift with time zones.

export type FuelEntry = {
  id: string;
  date: string;
  odometerKm: number;
  liters: number;
  totalPrice: number;
};

export type MaintenanceKind = 'oil' | 'coolant';

export type MaintenanceEntry = {
  id: string;
  kind: MaintenanceKind;
  date: string;
  odometerKm: number;
  note?: string;
};

export type Interval = {
  km: number;
  months: number;
};

export type Intervals = Record<MaintenanceKind, Interval>;

// My defaults: oil every 10,000 km or a year, coolant checked every 6 months or 10,000 km.
export const DEFAULT_INTERVALS: Intervals = {
  oil: { km: 10000, months: 12 },
  coolant: { km: 10000, months: 6 },
};

export const KIND_LABELS: Record<MaintenanceKind, string> = {
  oil: 'Engine oil',
  coolant: 'Coolant',
};
