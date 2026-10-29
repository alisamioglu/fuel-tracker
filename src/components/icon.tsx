import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

// SF Symbols on iPhone, Material Symbols on Android and web
const ICONS = {
  fuel: { ios: 'fuelpump.fill', android: 'local_gas_station', web: 'local_gas_station' },
  stats: { ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' },
  service: { ios: 'wrench.and.screwdriver.fill', android: 'build', web: 'build' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  oil: { ios: 'drop.fill', android: 'oil_barrel', web: 'oil_barrel' },
  coolant: { ios: 'thermometer.medium', android: 'device_thermostat', web: 'device_thermostat' },
  add: { ios: 'plus', android: 'add', web: 'add' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
  road: { ios: 'road.lanes', android: 'route', web: 'route' },
  money: { ios: 'banknote', android: 'payments', web: 'payments' },
  calendar: { ios: 'calendar', android: 'calendar_month', web: 'calendar_month' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  bell: { ios: 'bell.fill', android: 'notifications', web: 'notifications' },
  globe: { ios: 'globe', android: 'language', web: 'language' },
  speed: { ios: 'gauge.with.dots.needle.67percent', android: 'speed', web: 'speed' },
  lock: { ios: 'lock.fill', android: 'lock', web: 'lock' },
} satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

type IconProps = {
  name: IconName;
  size?: number;
  color: string;
};

export function Icon({ name, size = 20, color }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
