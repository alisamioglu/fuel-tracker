import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import type { DueInfo } from './maintenance';
import { KIND_LABELS, type MaintenanceKind } from './types';

const CHANNEL_ID = 'maintenance';

// Show reminders even when the app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const MESSAGES: Record<MaintenanceKind, { title: string; body: string }> = {
  oil: {
    title: 'Time to check your engine oil',
    body: 'Your oil change is due. Check the level and book a change.',
  },
  coolant: {
    title: 'Time to check your coolant',
    body: 'Check the coolant (radiator water) level while the engine is cold.',
  },
};

function reminderId(kind: MaintenanceKind) {
  return `${kind}-reminder`;
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Maintenance reminders',
      // The enum is exported at runtime, the import plugin just can't see it in the built file
      // eslint-disable-next-line import/namespace
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// I keep exactly one scheduled reminder per kind, so I just replace it every time data changes
export async function scheduleReminder(info: DueInfo) {
  if (Platform.OS === 'web') return;
  const id = reminderId(info.kind);
  await Notifications.cancelScheduledNotificationAsync(id);

  if (!info.remindAt || info.remindAt.getTime() <= Date.now()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: MESSAGES[info.kind],
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: info.remindAt,
      channelId: CHANNEL_ID,
    },
  });
}

// Just so I can see that notifications actually work on my phone
export async function sendTestNotification() {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: { title: 'Fuel Tracker', body: 'Notifications work. I will remind you about oil and coolant.' },
    trigger: null,
  });
}

// Fired right away, e.g. when a new fill-up shows I already passed the km limit
export async function notifyNow(kind: MaintenanceKind, kmOver: number) {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${KIND_LABELS[kind]} is overdue`,
      body:
        kmOver > 0
          ? `You are ${Math.round(kmOver)} km past the ${KIND_LABELS[kind].toLowerCase()} interval.`
          : MESSAGES[kind].body,
    },
    trigger: null,
  });
}
