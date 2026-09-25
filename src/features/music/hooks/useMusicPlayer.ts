import { useContext } from "react";

import { MusicPlayerContext } from "@/src/features/music/services/MusicPlayerProvider";

export function useMusicPlayer() {
  const player = useContext(MusicPlayerContext);

  if (!player) {
    throw new Error("useMusicPlayer must be used within MusicPlayerProvider");
  }

  return player;
}
