import { Platform } from "react-native";
import { getNotifications } from "@/src/features/tasks/notifications";
import { Habit, setHabitNotificationIds } from "./habitsRepository";

function oldIds(habit: Habit) {
  try {
    const parsed: unknown = JSON.parse(habit.notification_ids || "[]");
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}
export async function syncHabitReminder(habit: Habit) {
  const Notifications = await getNotifications();
  if (!Notifications) return habit.reminder_time && !habit.archived ? "Reminders require an installed app build on this device." : null;
  const ids = oldIds(habit);
  for (const id of ids) await Notifications.cancelScheduledNotificationAsync(id);
  await setHabitNotificationIds(habit.id, []);
  if (!habit.reminder_time || habit.archived) return null;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("habits", {
      name: "Habit reminders", importance: Notifications.AndroidImportance.HIGH,
    });
  }
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return "Allow notifications in device settings to receive reminders.";
  const [hour, minute] = habit.reminder_time.split(":").map(Number);
  const newIds: string[] = [];
  try {
    for (let day = 0; day < 7; day++) {
      if (!(habit.weekdays & (1 << day))) continue;
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: "Time for your habit", body: habit.title, sound: true, data: { habitId: habit.id } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, hour, minute,
          channelId: Platform.OS === "android" ? "habits" : undefined,
        },
      });
      newIds.push(id);
    }
    await setHabitNotificationIds(habit.id, newIds);
    return null;
  } catch (error) {
    for (const id of newIds) await Notifications.cancelScheduledNotificationAsync(id);
    console.warn("Unable to schedule habit reminder", error);
    return "Reminder could not be scheduled. Try again later.";
  }
}
export async function cancelHabitReminder(habit: Habit) {
  await cancelHabitNotifications(habit);
  await setHabitNotificationIds(habit.id, []);
}

export async function cancelHabitNotifications(habit: Habit) {
  const Notifications = await getNotifications();
  if (Notifications) {
    for (const id of oldIds(habit)) await Notifications.cancelScheduledNotificationAsync(id);
  }
}
