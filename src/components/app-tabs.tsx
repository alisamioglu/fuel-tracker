import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Fuel</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fuelpump.fill" md="local_gas_station" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>Stats</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="maintenance">
        <NativeTabs.Trigger.Label>Maintenance</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver.fill" md="build" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
