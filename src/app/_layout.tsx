import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { I18nProvider, useI18n } from '@/i18n';
import { DataProvider } from '@/lib/data-context';

function RootStack() {
  const { t } = useI18n();
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.primary,
        headerTitleStyle: { color: theme.text },
        contentStyle: { backgroundColor: theme.background },
      }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-fuel" options={{ presentation: 'modal', title: t('newFillUp') }} />
      <Stack.Screen name="add-service" options={{ presentation: 'modal', title: t('logService') }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <I18nProvider>
        <DataProvider>
          <RootStack />
        </DataProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
