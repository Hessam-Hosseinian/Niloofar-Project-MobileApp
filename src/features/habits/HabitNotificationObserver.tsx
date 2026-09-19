import { router, useRootNavigationState } from "expo-router";
import { useEffect } from "react";

import { useAuth } from "@/src/auth/AuthProvider";
import { getNotifications } from "@/src/features/tasks/notifications";

export function HabitNotificationObserver() {
  const { isLoading, isLoggedIn } = useAuth();
  const navigationKey = useRootNavigationState()?.key;

  useEffect(() => {
    if (isLoading || !isLoggedIn || !navigationKey) return;
    let active = true;
    let subscription: { remove: () => void } | undefined;

    void getNotifications().then((Notifications) => {
      if (!Notifications || !active) return;
      const seen = new Set<string>();
      const openHabit = (response: ReturnType<typeof Notifications.getLastNotificationResponse>) => {
        if (!response || seen.has(response.notification.request.identifier)) return;
        const id = Number(response.notification.request.content.data?.habitId);
        if (!Number.isSafeInteger(id) || id <= 0) return;
        seen.add(response.notification.request.identifier);
        router.push({ pathname: "/(app)/service/habits/[habitId]", params: { habitId: String(id) } });
        void Notifications.clearLastNotificationResponseAsync();
      };
      subscription = Notifications.addNotificationResponseReceivedListener(openHabit);
      openHabit(Notifications.getLastNotificationResponse());
    }).catch((error) => console.warn("Unable to observe habit reminders", error));

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [isLoading, isLoggedIn, navigationKey]);

  return null;
}
