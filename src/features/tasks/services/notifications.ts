import { isRunningInExpoGo } from "expo";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

let notificationsModulePromise: Promise<NotificationsModule> | null = null;

export async function getNotifications() {
  // expo-notifications 57 crashes while its root module is imported in Expo Go
  // on Android. Local reminders remain available in development and app builds.
  if (Platform.OS === "web" || (Platform.OS === "android" && isRunningInExpoGo())) {
    return null;
  }

  notificationsModulePromise ??= import("expo-notifications");

  return notificationsModulePromise;
}

export async function initializeNotifications() {
  try {
    const Notifications = await getNotifications();

    if (!Notifications) {
      return;
    }

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("tasks", {
        name: "Task reminders",
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

  } catch (error) {
    console.warn("Unable to initialize task notifications", error);
  }
}

export async function scheduleTaskReminder(
  title: string,
  dueAt: string,
  reminderMinutes: number,
) {
  const dueTimestamp = new Date(dueAt).getTime();

  if (
    !Number.isFinite(dueTimestamp) ||
    !Number.isFinite(reminderMinutes) ||
    reminderMinutes < 0
  ) {
    return null;
  }

  const triggerTimestamp = dueTimestamp - reminderMinutes * 60 * 1000;

  if (!Number.isFinite(triggerTimestamp) || triggerTimestamp <= Date.now()) {
    return null;
  }

  try {
    const Notifications = await getNotifications();

    if (!Notifications) {
      return null;
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "Task reminder",
        body: title,
        sound: true,
      },

      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(triggerTimestamp),
        channelId: Platform.OS === "android" ? "tasks" : undefined,
      },
    });
  } catch (error) {
    console.warn("Unable to schedule task reminder", error);

    return null;
  }
}

export async function cancelTaskReminder(
  notificationId: string | null | undefined,
) {
  if (!notificationId) {
    return;
  }

  try {
    const Notifications = await getNotifications();

    if (!Notifications) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.warn("Unable to cancel task reminder", error);
  }
}
