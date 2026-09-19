import { useEffect, useState } from "react";
import { AppState } from "react-native";

import { getLocalDay } from "@/src/features/habits/data/habitsRepository";

export function useCurrentDay() {
  const [today, setToday] = useState(getLocalDay);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      setToday(getLocalDay());
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      clearTimeout(timer);
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 1000);
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });
    refresh();
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
