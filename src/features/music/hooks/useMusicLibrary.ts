import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

import {
  getHiddenDeviceTrackCount,
  getLibraryTracks,
  getRecentlyPlayedTracks,
  restoreHiddenDeviceTracks,
  subscribeToMusicChanges,
} from "@/src/features/music/data/musicRepository";
import {
  importLocalMusic,
  scanPhoneMusic,
  scanPhoneMusicAutomaticallyOnce,
} from "@/src/features/music/services/musicLibraryService";
import type { LibraryTrack } from "@/src/features/music/types";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong with your music library.";
}

export function useMusicLibrary(autoScan = false) {
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [recentTracks, setRecentTracks] = useState<LibraryTrack[]>([]);
  const [hiddenCount, setHiddenCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"scan" | "import" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [nextTracks, nextRecentTracks, nextHiddenCount] = await Promise.all([
        getLibraryTracks(),
        getRecentlyPlayedTracks(),
        getHiddenDeviceTrackCount(),
      ]);
      setTracks(nextTracks);
      setRecentTracks(nextRecentTracks);
      setHiddenCount(nextHiddenCount);
      setError(null);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  useEffect(() => subscribeToMusicChanges(() => { void refresh(); }), [refresh]);

  useEffect(() => {
    if (!autoScan || Platform.OS !== "android") return;
    let mounted = true;
    setBusy("scan");
    void scanPhoneMusicAutomaticallyOnce()
      .then((count) => {
        if (mounted && count !== null) {
          setMessage(`Found ${count} songs on this phone.`);
          void refresh();
        }
      })
      .catch((caught: unknown) => {
        if (mounted) setError(errorMessage(caught));
      })
      .finally(() => {
        if (mounted) setBusy(null);
      });
    return () => { mounted = false; };
  }, [autoScan, refresh]);

  const scan = useCallback(async () => {
    if (busy) return;
    setBusy("scan");
    setError(null);
    setMessage(null);
    try {
      const count = await scanPhoneMusic();
      setMessage(`Found ${count} songs on this phone.`);
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }, [busy, refresh]);

  const importFiles = useCallback(async () => {
    if (busy) return;
    setBusy("import");
    setError(null);
    setMessage(null);
    try {
      const result = await importLocalMusic();
      if (!result.canceled) {
        const parts = [`Imported ${result.added} song${result.added === 1 ? "" : "s"}.`];
        if (result.duplicates) parts.push(`${result.duplicates} duplicate skipped.`);
        if (result.unsupported) parts.push(`${result.unsupported} unsupported skipped.`);
        if (result.failed) parts.push(`${result.failed} failed.`);
        setMessage(parts.join(" "));
        await refresh();
      }
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(null);
    }
  }, [busy, refresh]);

  const restoreHidden = useCallback(async () => {
    try {
      await restoreHiddenDeviceTracks();
      setMessage("Excluded phone songs are visible again.");
      await refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    }
  }, [refresh]);

  return {
    tracks, favoriteTracks: tracks.filter((track) => track.favorite), recentTracks,
    hiddenCount, loading, busy, message, error,
    refresh, scan, importFiles, restoreHidden,
  };
}
