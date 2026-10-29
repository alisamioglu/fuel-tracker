// Dates are stored as plain 'YYYY-MM-DD' strings so they don't shift with time zones.
// Distances are always stored in km and volumes in liters, the screens convert if needed.

export type FuelEntry = {
  id: string;
  date: string;
  odometerKm: number;
  liters: number;
  totalPrice: number;
  // A partial fill-up doesn't close a trip, its liters roll into the next full tank
  partial?: boolean;
  station?: string;
};

export type MaintenanceKind =
  | 'oil'
  | 'coolant'
  | 'tires'
  | 'brakes'
  | 'airFilter'
  | 'battery'
  | 'timingBelt'
  | 'inspection'
  | 'insurance';

export type MaintenanceEntry = {
  id: string;
  kind: MaintenanceKind;
  date: string;
  odometerKm: number;
  note?: string;
  place?: string;
};

// km = 0 means this one only goes by time (like insurance)
export type Interval = {
  km: number;
  months: number;
};

export type Intervals = Record<MaintenanceKind, Interval>;

export const MAINTENANCE_KINDS: MaintenanceKind[] = [
  'oil',
  'coolant',
  'tires',
  'brakes',
  'airFilter',
  'battery',
  'timingBelt',
  'inspection',
  'insurance',
];

export const KIND_EMOJI: Record<MaintenanceKind, string> = {
  oil: '🛢️',
  coolant: '🌡️',
  tires: '🛞',
  brakes: '🛑',
  airFilter: '💨',
  battery: '🔋',
  timingBelt: '⚙️',
  inspection: '📋',
  insurance: '🛡️',
};

// My defaults, roughly what most service books say
export const DEFAULT_INTERVALS: Intervals = {
  oil: { km: 10000, months: 12 },
  coolant: { km: 10000, months: 6 },
  tires: { km: 0, months: 6 },
  brakes: { km: 30000, months: 24 },
  airFilter: { km: 15000, months: 12 },
  battery: { km: 0, months: 48 },
  timingBelt: { km: 90000, months: 60 },
  inspection: { km: 0, months: 24 },
  insurance: { km: 0, months: 12 },
};

export type Currency = 'TRY' | 'EUR' | 'USD' | 'GBP' | 'RUB';
export const CURRENCIES: Currency[] = ['TRY', 'EUR', 'USD', 'GBP', 'RUB'];

export type Units = 'metric' | 'imperial';

export type Settings = {
  currency: Currency;
  units: Units;
  carName: string;
  carEmoji: string;
};

export const CAR_EMOJIS = ['🚗', '🚙', '🏎️', '🚕', '🛻', '🚐', '🏍️', '🚘'];
