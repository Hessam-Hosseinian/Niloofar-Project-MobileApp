import { useContext } from "react";

import { MusicQueueContext } from "@/src/features/music/services/MusicPlayerProvider";

export function useMusicQueue() {
  const queue = useContext(MusicQueueContext);
  if (!queue) throw new Error("Music queue requires MusicPlayerProvider");
  return queue;
}
