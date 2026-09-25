import { useContext } from "react";

import { MusicPlayerActionsContext } from "@/src/features/music/services/MusicPlayerProvider";

export function useMusicPlayerActions() {
  const actions = useContext(MusicPlayerActionsContext);
  if (!actions) throw new Error("Music player actions require MusicPlayerProvider");
  return actions;
}
