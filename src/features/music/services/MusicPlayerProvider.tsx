import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
  type AudioStatus,
} from "expo-audio";
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState } from "react-native";

import type { LibraryTrack, MusicTrack } from "@/src/features/music/types";
import {
  getLastMusicTrackId,
  getMusicTrackById,
  recordMusicPlay,
  saveLastMusicTrackId,
  saveMusicPosition,
  subscribeToMusicChanges,
  toggleMusicFavorite,
} from "@/src/features/music/data/musicRepository";
import {
  advanceListeningProgress,
  newListeningProgress,
  type ListeningProgress,
} from "@/src/features/music/utils/playHistory";
import {
  appendToQueue,
  clearUpcoming,
  currentQueueEntry,
  emptyPlaybackQueue,
  insertNext,
  moveUpcoming,
  nextQueueForMode,
  queueWithSelection,
  removeQueueEntry,
  removeTrackFromQueue,
  restoreUpcoming,
  selectQueueEntry,
  shuffleUpcoming,
  stepQueue,
  type PlaybackQueue,
  type QueueEntry,
  type RepeatMode,
} from "@/src/features/music/utils/playbackQueue";

type MusicPlayerContextValue = {
  currentTrack: MusicTrack | null;
  queue: PlaybackQueue;
  status: AudioStatus;
  error: string | null;
  playTrack: (track: MusicTrack) => void;
  resumeTrack: (track: LibraryTrack) => void;
  playFromList: (track: MusicTrack, tracks: MusicTrack[]) => void;
  addToQueue: (track: MusicTrack) => void;
  playNext: (track: MusicTrack) => void;
  toggleFavorite: (trackId: string) => Promise<void>;
  next: () => void;
  previous: () => void;
  jumpToQueueEntry: (id: number) => void;
  removeFromQueue: (id: number) => void;
  clearUpcoming: () => void;
  moveInQueue: (id: number, direction: -1 | 1) => void;
  togglePlayback: () => Promise<void>;
  pause: () => void;
  seekTo: (seconds: number) => Promise<void>;
  restart: () => Promise<void>;
  playbackRate: number;
  setPlaybackRate: (rate: number) => void;
  shuffleEnabled: boolean;
  toggleShuffle: () => void;
  repeatMode: RepeatMode;
  cycleRepeatMode: () => void;
  clearTrack: (id: string) => void;
};

type MusicPlayerActions = Pick<
  MusicPlayerContextValue,
  "playTrack" | "resumeTrack" | "playFromList" | "addToQueue" | "playNext" | "toggleFavorite" | "clearTrack"
>;
type MusicQueueContextValue = Pick<
  MusicPlayerContextValue,
  "queue" | "shuffleEnabled" | "jumpToQueueEntry" | "removeFromQueue" | "clearUpcoming" | "moveInQueue"
>;

export const MusicPlayerContext = createContext<MusicPlayerContextValue | null>(
  null,
);
export const MusicPlayerActionsContext = createContext<MusicPlayerActions | null>(null);
export const MusicQueueContext = createContext<MusicQueueContextValue | null>(null);

export function MusicPlayerProvider({ children }: PropsWithChildren) {
  const player = useAudioPlayer(null, {
    updateInterval: 250,
    keepAudioSessionActive: true,
  });
  const status = useAudioPlayerStatus(player);
  const [queue, setQueue] = useState<PlaybackQueue>(emptyPlaybackQueue);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [playbackRate, setPlaybackRateState] = useState(1);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const originalQueueOrder = useRef<number[]>([]);
  const queueRef = useRef(queue);
  const nextEntryId = useRef(1);
  const handledFinishId = useRef<number | null>(null);
  const finishArmed = useRef(false);
  const listeningRef = useRef<ListeningProgress | null>(null);
  const statusRef = useRef(status);
  const pendingResume = useRef<{ entryId: number; seconds: number } | null>(null);
  const lastPositionWrite = useRef(0);
  statusRef.current = status;
  const currentTrack = currentQueueEntry(queue)?.track ?? null;

  const commitQueue = useCallback((nextQueue: PlaybackQueue) => {
    queueRef.current = nextQueue;
    setQueue(nextQueue);
  }, []);

  const persistPosition = useCallback((notify = false) => {
    const entry = currentQueueEntry(queueRef.current);
    if (!entry || (entry.track.sourceType !== "imported" && entry.track.sourceType !== "device")) return;
    const position = statusRef.current.currentTime;
    const duration = statusRef.current.duration;
    const seconds = duration > 0 && position >= duration - 2 ? 0 : position;
    void saveMusicPosition(entry.track.id, seconds, notify).catch((error: unknown) => {
      console.warn("Could not save music position", error);
    });
  }, []);

  const activateQueue = useCallback((nextQueue: PlaybackQueue, resumeSeconds = 0, savePrevious = true) => {
    const entry = currentQueueEntry(nextQueue);
    if (savePrevious) persistPosition();
    lastPositionWrite.current = 0;
    finishArmed.current = false;
    listeningRef.current = entry ? newListeningProgress(entry.id) : null;
    pendingResume.current = entry && resumeSeconds > 0 ? { entryId: entry.id, seconds: resumeSeconds } : null;
    try {
      if (entry) {
        player.replace(entry.track.source);
        player.setPlaybackRate(playbackRate);
        player.setActiveForLockScreen(true, {
          title: entry.track.title,
          artist: entry.track.artist,
          albumTitle: entry.track.album,
        }, { showSeekBackward: true, showSeekForward: true });
        player.play();
      } else {
        player.pause();
        player.replace(null);
        player.clearLockScreenControls();
      }
      void saveLastMusicTrackId(entry && (entry.track.sourceType === "imported" || entry.track.sourceType === "device") ? entry.track.id : null)
        .catch((error: unknown) => console.warn("Could not save last music track", error));
      handledFinishId.current = null;
      commitQueue(nextQueue);
      setSessionError(null);
    } catch (error) {
      listeningRef.current = null;
      finishArmed.current = true;
      console.warn("Music queue playback failed", error);
      setSessionError("This audio file could not be played.");
    }
  }, [commitQueue, persistPosition, player, playbackRate]);

  const createEntry = useCallback((track: MusicTrack): QueueEntry => ({
    id: nextEntryId.current++,
    track,
  }), []);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: "doNotMix",
    }).catch((error: unknown) => {
      console.warn("Unable to configure the music audio session", error);
      setSessionError("Niloofar could not configure audio on this device.");
    });
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") persistPosition();
    });
    return () => subscription.remove();
  }, [persistPosition]);

  useEffect(() => subscribeToMusicChanges(() => {
    const active = currentQueueEntry(queueRef.current);
    if (!active || (active.track.sourceType !== "imported" && active.track.sourceType !== "device")) return;
    void getMusicTrackById(active.track.id).then((fresh) => {
      if (!fresh || currentQueueEntry(queueRef.current)?.id !== active.id) return;
      commitQueue({
        ...queueRef.current,
        entries: queueRef.current.entries.map((entry) => entry.id === active.id ? { ...entry, track: fresh } : entry),
      });
      player.updateLockScreenMetadata({ title: fresh.title, artist: fresh.artist, albumTitle: fresh.album });
    }).catch((error: unknown) => console.warn("Could not refresh active music metadata", error));
  }), [commitQueue, player]);

  const playTrack = useCallback(
    (track: MusicTrack) => {
      const entry = createEntry(track);
      originalQueueOrder.current = [entry.id];
      activateQueue({ entries: [entry], currentIndex: 0 });
    },
    [activateQueue, createEntry],
  );

  const resumeTrack = useCallback((track: LibraryTrack) => {
    const entry = createEntry(track);
    originalQueueOrder.current = [entry.id];
    activateQueue({ entries: [entry], currentIndex: 0 }, track.resumeSeconds);
  }, [activateQueue, createEntry]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (![0.75, 1, 1.25, 1.5, 2].includes(rate)) return;
    player.setPlaybackRate(rate);
    setPlaybackRateState(rate);
  }, [player]);

  const playFromList = useCallback((track: MusicTrack, tracks: MusicTrack[]) => {
    const entries = tracks.map(createEntry);
    const selected = entries.find((entry) => entry.track.id === track.id);
    if (!selected) return playTrack(track);
    originalQueueOrder.current = entries.map((entry) => entry.id);
    const nextQueue = queueWithSelection(entries, selected.id);
    activateQueue(shuffleEnabled
      ? shuffleUpcoming({ entries: [selected, ...entries.filter((entry) => entry.id !== selected.id)], currentIndex: 0 })
      : nextQueue);
  }, [activateQueue, createEntry, playTrack, shuffleEnabled]);

  const addToQueue = useCallback((track: MusicTrack) => {
    const hadCurrent = !!currentQueueEntry(queueRef.current);
    const entry = createEntry(track);
    originalQueueOrder.current.push(entry.id);
    const nextQueue = appendToQueue(queueRef.current, entry);
    if (hadCurrent) commitQueue(nextQueue);
    else activateQueue(nextQueue);
  }, [activateQueue, commitQueue, createEntry]);

  const playNext = useCallback((track: MusicTrack) => {
    const hadCurrent = !!currentQueueEntry(queueRef.current);
    const entry = createEntry(track);
    const currentId = currentQueueEntry(queueRef.current)?.id;
    const insertion = currentId ? originalQueueOrder.current.indexOf(currentId) + 1 : 0;
    originalQueueOrder.current.splice(insertion, 0, entry.id);
    const nextQueue = insertNext(queueRef.current, entry);
    if (hadCurrent) commitQueue(nextQueue);
    else activateQueue(nextQueue);
  }, [activateQueue, commitQueue, createEntry]);

  const toggleFavorite = useCallback(async (trackId: string) => {
    const favorite = await toggleMusicFavorite(trackId);
    if (!queueRef.current.entries.some((entry) => entry.track.id === trackId)) return;
    commitQueue({
      ...queueRef.current,
      entries: queueRef.current.entries.map((entry) =>
        entry.track.id === trackId
          ? { ...entry, track: { ...entry.track, favorite } }
          : entry
      ),
    });
  }, [commitQueue]);

  const next = useCallback(() => {
    const nextQueue = queueRef.current.currentIndex >= queueRef.current.entries.length - 1 && repeatMode === "all"
      ? nextQueueForMode(queueRef.current, "all", shuffleEnabled)
      : stepQueue(queueRef.current, 1);
    if (nextQueue !== queueRef.current) activateQueue(nextQueue);
  }, [activateQueue, repeatMode, shuffleEnabled]);

  const toggleShuffle = useCallback(() => {
    if (shuffleEnabled) {
      commitQueue(restoreUpcoming(queueRef.current, originalQueueOrder.current));
      setShuffleEnabled(false);
    } else {
      originalQueueOrder.current = queueRef.current.entries.map((entry) => entry.id);
      commitQueue(shuffleUpcoming(queueRef.current));
      setShuffleEnabled(true);
    }
  }, [commitQueue, shuffleEnabled]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((current) => current === "off" ? "all" : current === "all" ? "one" : "off");
  }, []);

  const previous = useCallback(() => {
    if (statusRef.current.currentTime > 3 || (queueRef.current.currentIndex <= 0 && (repeatMode !== "all" || queueRef.current.entries.length <= 1))) {
      void player.seekTo(0).then(() => {
        lastPositionWrite.current = 0;
        const active = currentQueueEntry(queueRef.current);
        if (active?.track.sourceType === "imported" || active?.track.sourceType === "device") {
          void saveMusicPosition(active.track.id, 0, true)
            .catch((error: unknown) => console.warn("Could not reset music position", error));
        }
      }).catch(() => setSessionError("Could not restart this track."));
      return;
    }
    const previousQueue = stepQueue(queueRef.current, -1);
    if (previousQueue !== queueRef.current) activateQueue(previousQueue);
    else if (repeatMode === "all" && queueRef.current.entries.length > 1) {
      activateQueue({ ...queueRef.current, currentIndex: queueRef.current.entries.length - 1 });
    }
  }, [activateQueue, player, repeatMode]);

  const jumpToQueueEntry = useCallback((id: number) => {
    const nextQueue = selectQueueEntry(queueRef.current, id);
    if (nextQueue !== queueRef.current) activateQueue(nextQueue);
  }, [activateQueue]);

  const removeFromQueue = useCallback((id: number) => {
    const before = currentQueueEntry(queueRef.current);
    const nextQueue = removeQueueEntry(queueRef.current, id);
    if (nextQueue === queueRef.current) return;
    if (before?.id === id) activateQueue(nextQueue);
    else commitQueue(nextQueue);
  }, [activateQueue, commitQueue]);

  const clearUpcomingTracks = useCallback(() => {
    const nextQueue = clearUpcoming(queueRef.current);
    if (nextQueue !== queueRef.current) commitQueue(nextQueue);
  }, [commitQueue]);

  const moveInQueue = useCallback((id: number, direction: -1 | 1) => {
    const nextQueue = moveUpcoming(queueRef.current, id, direction);
    if (nextQueue !== queueRef.current) commitQueue(nextQueue);
  }, [commitQueue]);

  const clearTrack = useCallback((id: string) => {
    const before = currentQueueEntry(queueRef.current);
    const nextQueue = removeTrackFromQueue(queueRef.current, id);
    if (nextQueue === queueRef.current) return;
    if (before?.track.id === id) activateQueue(nextQueue);
    else commitQueue(nextQueue);
  }, [activateQueue, commitQueue]);

  useEffect(() => {
    const subscription = player.addListener("playbackStatusUpdate", (nextStatus) => {
      const playingEntry = currentQueueEntry(queueRef.current);
      if (playingEntry && pendingResume.current?.entryId === playingEntry.id && nextStatus.isLoaded) {
        const target = pendingResume.current.seconds;
        pendingResume.current = null;
        void player.seekTo(target).catch((error: unknown) => console.warn("Could not restore music position", error));
      }
      if (playingEntry && nextStatus.playing && nextStatus.currentTime - lastPositionWrite.current >= 15) {
        lastPositionWrite.current = nextStatus.currentTime;
        persistPosition();
      }
      const listening = listeningRef.current;
      if (playingEntry && listening?.entryId === playingEntry.id) {
        const updated = advanceListeningProgress(listening, nextStatus);
        listeningRef.current = updated.progress;
        if (updated.shouldRecord && (
          playingEntry.track.sourceType === "imported" || playingEntry.track.sourceType === "device"
        )) {
          void recordMusicPlay(playingEntry.track.id).catch((error: unknown) => {
            console.warn("Could not save music play history", error);
            if (listeningRef.current?.entryId === playingEntry.id) {
              listeningRef.current = { ...listeningRef.current, recorded: false };
            }
          });
        }
      }
      if (!nextStatus.didJustFinish) {
        if (nextStatus.playing) finishArmed.current = true;
        return;
      }
      const active = currentQueueEntry(queueRef.current);
      if (!finishArmed.current || !active || handledFinishId.current === active.id) return;
      finishArmed.current = false;
      handledFinishId.current = active.id;
      if (active.track.sourceType === "imported" || active.track.sourceType === "device") {
        void saveMusicPosition(active.track.id, 0, true).catch((error: unknown) => console.warn("Could not reset music position", error));
      }
      const nextQueue = nextQueueForMode(queueRef.current, repeatMode, shuffleEnabled);
      if (nextQueue !== queueRef.current || repeatMode === "one") activateQueue(nextQueue, 0, false);
    });
    return () => subscription.remove();
  }, [activateQueue, persistPosition, player, repeatMode, shuffleEnabled]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const id = await getLastMusicTrackId();
        if (!id || cancelled || queueRef.current.entries.length) return;
        const track = await getMusicTrackById(id);
        if (!track?.available || cancelled || queueRef.current.entries.length) return;
        const entry = createEntry(track);
        pendingResume.current = track.resumeSeconds > 0 ? { entryId: entry.id, seconds: track.resumeSeconds } : null;
        player.replace(track.source);
        commitQueue({ entries: [entry], currentIndex: 0 });
      } catch (error) {
        console.warn("Could not restore last music track", error);
      }
    })();
    return () => { cancelled = true; };
  }, [commitQueue, createEntry, player]);

  const seekTo = useCallback(
    async (seconds: number) => {
      if (!currentTrack) {
        return;
      }

      const upperBound = status.duration > 0 ? status.duration : seconds;
      const target = Math.min(Math.max(seconds, 0), upperBound);
      await player.seekTo(target);
      lastPositionWrite.current = target;
      if (currentTrack.sourceType === "imported" || currentTrack.sourceType === "device") {
        void saveMusicPosition(currentTrack.id, target, true)
          .catch((error: unknown) => console.warn("Could not save music seek position", error));
      }
    },
    [currentTrack, player, status.duration],
  );

  const restart = useCallback(async () => {
    if (!currentTrack) {
      return;
    }

    await player.seekTo(0);
    lastPositionWrite.current = 0;
    if (currentTrack.sourceType === "imported" || currentTrack.sourceType === "device") {
      void saveMusicPosition(currentTrack.id, 0, true)
        .catch((error: unknown) => console.warn("Could not reset music position", error));
    }
    player.setActiveForLockScreen(true, { title: currentTrack.title, artist: currentTrack.artist, albumTitle: currentTrack.album }, { showSeekBackward: true, showSeekForward: true });
    player.play();
  }, [currentTrack, player]);

  const togglePlayback = useCallback(async () => {
    if (!currentTrack) {
      return;
    }

    if (status.playing) {
      persistPosition(true);
      player.pause();
      return;
    }

    if (
      status.duration > 0 &&
      status.currentTime >= status.duration - 0.1
    ) {
      await player.seekTo(0);
    }

    player.setActiveForLockScreen(true, { title: currentTrack.title, artist: currentTrack.artist, albumTitle: currentTrack.album }, { showSeekBackward: true, showSeekForward: true });
    player.play();
  }, [currentTrack, persistPosition, player, status.currentTime, status.duration, status.playing]);

  const pause = useCallback(() => {
    persistPosition(true);
    player.pause();
  }, [persistPosition, player]);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      status,
      error: sessionError ?? status.error,
      playTrack,
      resumeTrack,
      playFromList,
      addToQueue,
      playNext,
      toggleFavorite,
      next,
      previous,
      jumpToQueueEntry,
      removeFromQueue,
      clearUpcoming: clearUpcomingTracks,
      moveInQueue,
      togglePlayback,
      pause,
      seekTo,
      restart,
      playbackRate,
      setPlaybackRate,
      shuffleEnabled,
      toggleShuffle,
      repeatMode,
      cycleRepeatMode,
      clearTrack,
    }),
    [
      currentTrack,
      queue,
      clearTrack,
      clearUpcomingTracks,
      addToQueue,
      jumpToQueueEntry,
      moveInQueue,
      next,
      pause,
      playTrack,
      resumeTrack,
      playFromList,
      playNext,
      toggleFavorite,
      previous,
      removeFromQueue,
      restart,
      playbackRate,
      setPlaybackRate,
      shuffleEnabled,
      toggleShuffle,
      repeatMode,
      cycleRepeatMode,
      seekTo,
      sessionError,
      status,
      togglePlayback,
    ],
  );

  const actions = useMemo<MusicPlayerActions>(
    () => ({ playTrack, resumeTrack, playFromList, addToQueue, playNext, toggleFavorite, clearTrack }),
    [playTrack, resumeTrack, playFromList, addToQueue, playNext, toggleFavorite, clearTrack],
  );
  const queueActions = useMemo<MusicQueueContextValue>(
    () => ({
      queue,
      shuffleEnabled,
      jumpToQueueEntry,
      removeFromQueue,
      clearUpcoming: clearUpcomingTracks,
      moveInQueue,
    }),
    [queue, shuffleEnabled, jumpToQueueEntry, removeFromQueue, clearUpcomingTracks, moveInQueue],
  );

  return (
    <MusicPlayerActionsContext.Provider value={actions}>
      <MusicQueueContext.Provider value={queueActions}>
        <MusicPlayerContext.Provider value={value}>
          {children}
        </MusicPlayerContext.Provider>
      </MusicQueueContext.Provider>
    </MusicPlayerActionsContext.Provider>
  );
}
