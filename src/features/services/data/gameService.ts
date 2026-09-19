import { Gamepad2 } from "lucide-react-native";

import { colors } from "@/src/theme";
import type { ServiceItem } from "./serviceCatalog";

export const gamesService: ServiceItem = {
  key: "games",
  title: "Mini Games",
  subtitle: "Quick games for short breaks",
  category: "utility",
  icon: Gamepad2,
  color: colors.purple,
  phase: 4,
  enabled: true,
};
