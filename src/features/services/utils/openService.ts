import { router } from "expo-router";

const directServiceRoutes: Record<string, string> = {
  tasks: "/(app)/service/tasks",
  calendar: "/(app)/service/calendar",
  habits: "/(app)/service/habits",
  games: "/(app)/service/games",
  music: "/(app)/service/music",
};

export function openService(serviceKey: string) {
  const directRoute = directServiceRoutes[serviceKey];

  if (directRoute) {
    router.push(directRoute as never);
    return;
  }

  router.push({
    pathname: "/(app)/service/[serviceKey]",
    params: { serviceKey },
  });
}
