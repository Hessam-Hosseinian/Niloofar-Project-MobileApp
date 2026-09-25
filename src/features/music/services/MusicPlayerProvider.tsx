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

import type { MusicTrack } from "@/src/features/music/types";
import {
  appendToQueue,
  clearUpcoming,
  currentQueueEntry,
  emptyPlaybackQueue,
  insertNext,
  moveUpcoming,
  queueWithSelection,
  removeQueueEntry,
  removeTrackFromQueue,
  selectQueueEntry,
  stepQueue,
  type PlaybackQueue,
  type QueueEntry,
} from "@/src/features/music/utils/playbackQueue";

type MusicPlayerContextValue = {
  currentTrack: MusicTrack | null;
  queue: PlaybackQueue;
  status: AudioStatus;
  error: string | null;
  playTrack: (track: MusicTrack) => void;
  playFromList: (track: MusicTrack, tracks: MusicTrack[]) => void;
  addToQueue: (track: MusicTrack) => void;
  playNext: (track: MusicTrack) => void;
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
  clearTrack: (id: string) => void;
};

type MusicPlayerActions = Pick<
  MusicPlayerContextValue,
  "playTrack" | "playFromList" | "addToQueue" | "playNext" | "clearTrack"
>;
type MusicQueueContextValue = Pick<
  MusicPlayerContextValue,
  "queue" | "jumpToQueueEntry" | "removeFromQueue" | "clearUpcoming" | "moveInQueue"
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
  const queueRef = useRef(queue);
  const nextEntryId = useRef(1);
  const handledFinishId = useRef<number | null>(null);
  const finishArmed = useRef(false);
  const statusRef = useRef(status);
  statusRef.current = status;
  const currentTrack = currentQueueEntry(queue)?.track ?? null;

  const commitQueue = useCallback((nextQueue: PlaybackQueue) => {
    queueRef.current = nextQueue;
    setQueue(nextQueue);
  }, []);

  const activateQueue = useCallback((nextQueue: PlaybackQueue) => {
    const entry = currentQueueEntry(nextQueue);
    finishArmed.current = false;
    try {
      if (entry) {
        player.replace(entry.track.source);
        player.play();
      } else {
        player.pause();
        player.replace(null);
      }
      handledFinishId.current = null;
      commitQueue(nextQueue);
      setSessionError(null);
    } catch (error) {
      finishArmed.current = true;
      console.warn("Music queue playback failed", error);
      setSessionError("This audio file could not be played.");
    }
  }, [commitQueue, player]);

  const createEntry = useCallback((track: MusicTrack): QueueEntry => ({
    id: nextEntryId.current++,
    track,
  }), []);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      interruptionMode: "doNotMix",
    }).catch((error: unknown) => {
      console.warn("Unable to configure the music audio session", error);
      setSessionError("Niloofar could not configure audio on this device.");
    });
  }, []);

  const playTrack = useCallback(
    (track: MusicTrack) => {
      const entry = createEntry(track);
      activateQueue({ entries: [entry], currentIndex: 0 });
    },
    [activateQueue, createEntry],
  );

  const playFromList = useCallback((track: MusicTrack, tracks: MusicTrack[]) => {
    const entries = tracks.map(createEntry);
    const selected = entries.find((entry) => entry.track.id === track.id);
    if (!selected) return playTrack(track);
    activateQueue(queueWithSelection(entries, selected.id));
  }, [activateQueue, createEntry, playTrack]);

  const addToQueue = useCallback((track: MusicTrack) => {
    const hadCurrent = !!currentQueueEntry(queueRef.current);
    const nextQueue = appendToQueue(queueRef.current, createEntry(track));
    if (hadCurrent) commitQueue(nextQueue);
    else activateQueue(nextQueue);
  }, [activateQueue, commitQueue, createEntry]);

  const playNext = useCallback((track: MusicTrack) => {
    const hadCurrent = !!currentQueueEntry(queueRef.current);
    const nextQueue = insertNext(queueRef.current, createEntry(track));
    if (hadCurrent) commitQueue(nextQueue);
    else activateQueue(nextQueue);
  }, [activateQueue, commitQueue, createEntry]);

  const next = useCallback(() => {
    const nextQueue = stepQueue(queueRef.current, 1);
    if (nextQueue !== queueRef.current) activateQueue(nextQueue);
  }, [activateQueue]);

  const previous = useCallback(() => {
    if (statusRef.current.currentTime > 3 || queueRef.current.currentIndex <= 0) {
      void player.seekTo(0).catch(() => setSessionError("Could not restart this track."));
      return;
    }
    activateQueue(stepQueue(queueRef.current, -1));
  }, [activateQueue, player]);

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
      if (!nextStatus.didJustFinish) {
        if (nextStatus.playing) finishArmed.current = true;
        return;
      }
      const active = currentQueueEntry(queueRef.current);
      if (!finishArmed.current || !active || handledFinishId.current === active.id) return;
      finishArmed.current = false;
      handledFinishId.current = active.id;
      const nextQueue = stepQueue(queueRef.current, 1);
      if (nextQueue !== queueRef.current) activateQueue(nextQueue);
    });
    return () => subscription.remove();
  }, [activateQueue, player]);

  const seekTo = useCallback(
    async (seconds: number) => {
      if (!currentTrack) {
        return;
      }

      const upperBound = status.duration > 0 ? status.duration : seconds;
      const target = Math.min(Math.max(seconds, 0), upperBound);
      await player.seekTo(target);
    },
    [currentTrack, player, status.duration],
  );

  const restart = useCallback(async () => {
    if (!currentTrack) {
      return;
    }

    await player.seekTo(0);
    player.play();
  }, [currentTrack, player]);

  const togglePlayback = useCallback(async () => {
    if (!currentTrack) {
      return;
    }

    if (status.playing) {
      player.pause();
      return;
    }

    if (
      status.duration > 0 &&
      status.currentTime >= status.duration - 0.1
    ) {
      await player.seekTo(0);
    }

    player.play();
  }, [currentTrack, player, status.currentTime, status.duration, status.playing]);

  const pause = useCallback(() => {
    player.pause();
  }, [player]);

  const value = useMemo<MusicPlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      status,
      error: sessionError ?? status.error,
      playTrack,
      playFromList,
      addToQueue,
      playNext,
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
      playFromList,
      playNext,
      previous,
      removeFromQueue,
      restart,
      seekTo,
      sessionError,
      status,
      togglePlayback,
    ],
  );

  const actions = useMemo<MusicPlayerActions>(
    () => ({ playTrack, playFromList, addToQueue, playNext, clearTrack }),
    [playTrack, playFromList, addToQueue, playNext, clearTrack],
  );
  const queueActions = useMemo<MusicQueueContextValue>(
    () => ({
      queue,
      jumpToQueueEntry,
      removeFromQueue,
      clearUpcoming: clearUpcomingTracks,
      moveInQueue,
    }),
    [queue, jumpToQueueEntry, removeFromQueue, clearUpcomingTracks, moveInQueue],
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
