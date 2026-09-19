import { router } from "expo-router";

export function openService(serviceKey: string) {
  if (serviceKey === "tasks") {
    router.push("/(app)/service/tasks");
    return;
  }
  if (serviceKey === "calendar") {
    router.push("/(app)/service/calendar");
    return;
  }

  if (serviceKey === "habits") {
    router.push("/(app)/service/habits");
    return;
  }

  router.push({
    pathname: "/(app)/service/[serviceKey]",
    params: { serviceKey },
  });
}
