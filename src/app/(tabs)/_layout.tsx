import { NativeTabs } from 'expo-router/native-tabs';

import { useTheme } from '@/hooks/use-theme';
import { useI18n } from '@/i18n';

export default function TabLayout() {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <NativeTabs
      backgroundColor={theme.backgroundElement}
      indicatorColor={theme.primarySoft}
      tintColor={theme.primary}
      labelStyle={{ selected: { color: theme.primary } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabFuel')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="fuelpump.fill" md="local_gas_station" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="stats">
        <NativeTabs.Trigger.Label>{t('tabStats')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.bar.fill" md="bar_chart" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="service">
        <NativeTabs.Trigger.Label>{t('tabService')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="wrench.and.screwdriver.fill" md="build" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>{t('tabSettings')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="gearshape.fill" md="settings" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
