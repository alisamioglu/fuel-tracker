import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useColorScheme } from 'react-native';

import { ToastProvider } from '@/components/toast';
import { useTheme } from '@/hooks/use-theme';
import { I18nProvider } from '@/i18n';
import { DataProvider } from '@/lib/data-context';

function RootStack() {
  const theme = useTheme();

  // The add/edit screens set their own title, since it depends on new vs edit
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
      <Stack.Screen name="add-fuel" options={{ presentation: 'modal' }} />
      <Stack.Screen name="add-service" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <I18nProvider>
        <DataProvider>
          <ToastProvider>
            <RootStack />
          </ToastProvider>
        </DataProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
