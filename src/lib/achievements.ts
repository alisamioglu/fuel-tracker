import type { TranslationKey } from '@/i18n/locales/en';

import { getStats } from './fuel';
import type { DueInfo } from './maintenance';
import type { FuelEntry } from './types';

// Little badges to make logging a bit more fun. All of them are worked out from the data,
// so nothing extra has to be stored.
export type Achievement = {
  id: string;
  emoji: string;
  title: TranslationKey;
  body: TranslationKey;
  unlocked: boolean;
};

function monthsInARow(fuel: FuelEntry[]) {
  const months = [...new Set(fuel.map((e) => e.date.slice(0, 7)))].sort();
  let best = 0;
  let run = 0;
  let previous: number | null = null;
  for (const key of months) {
    const [y, m] = key.split('-').map(Number);
    const index = y * 12 + m;
    run = previous !== null && index === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = index;
  }
  return best;
}

export function getAchievements(fuel: FuelEntry[], due: DueInfo[]): Achievement[] {
  const stats = getStats(fuel);
  const distance = stats?.totalDistanceKm ?? 0;
  const trips = stats?.trips ?? [];
  const latest = trips.at(-1);
  const tracked = due.filter((d) => d.status !== 'none');

  const list: Omit<Achievement, 'unlocked'>[] = [];
  const unlocked: Record<string, boolean> = {};

  function add(id: string, emoji: string, done: boolean) {
    list.push({
      id,
      emoji,
      title: `badge_${id}_title` as TranslationKey,
      body: `badge_${id}_body` as TranslationKey,
    });
    unlocked[id] = done;
  }

  add('first', '🚀', fuel.length >= 1);
  add('ten', '⛽', fuel.length >= 10);
  add('km1000', '🛣️', distance >= 1000);
  add('km10000', '🌍', distance >= 10000);
  add(
    'eco',
    '🌱',
    !!latest && !!stats && trips.length >= 3 && latest.litersPer100Km <= stats.avgLitersPer100Km * 0.95,
  );
  add('streak', '📅', monthsInARow(fuel) >= 3);
  add('service', '🛠️', tracked.length >= 3 && tracked.every((d) => d.status === 'ok'));

  return list.map((a) => ({ ...a, unlocked: unlocked[a.id] }));
}
