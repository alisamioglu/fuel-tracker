import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { translate } from '@/i18n';

import type { DueInfo } from './maintenance';
import { KIND_EMOJI, type MaintenanceKind } from './types';

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

function reminderId(kind: MaintenanceKind) {
  return `${kind}-reminder`;
}

function reminderContent(kind: MaintenanceKind) {
  // Oil and coolant get their own wording, the rest share a general one
  if (kind === 'oil') return { title: translate('notifOilTitle'), body: translate('notifOilBody') };
  if (kind === 'coolant') {
    return { title: translate('notifCoolantTitle'), body: translate('notifCoolantBody') };
  }
  const name = translate(kind);
  return {
    title: `${KIND_EMOJI[kind]} ${translate('notifDueTitle', { name })}`,
    body: translate('notifDueBody', { name }),
  };
}

export async function ensurePermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: translate('channelName'),
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

  if (!info.remindAt) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: reminderContent(info.kind),
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
    content: { title: translate('notifTestTitle'), body: translate('notifTestBody') },
    trigger: null,
  });
}

// Fired right away, e.g. when a new fill-up shows I already passed the km limit
export async function notifyNow(kind: MaintenanceKind, overBy: string) {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${KIND_EMOJI[kind]} ${translate('notifOverdueTitle', { name: translate(kind) })}`,
      body: translate('notifOverdueBody', { distance: overBy }),
    },
    trigger: null,
  });
}
