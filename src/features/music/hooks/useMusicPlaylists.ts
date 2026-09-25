import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

import {
  getMusicPlaylists,
  type MusicPlaylist,
} from "@/src/features/music/data/musicPlaylistRepository";

export function useMusicPlaylists() {
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setPlaylists(await getMusicPlaylists());
      setError(null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load playlists.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return { playlists, loading, error, refresh };
}
