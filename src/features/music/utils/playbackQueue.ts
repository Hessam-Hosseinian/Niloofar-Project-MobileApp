import type { MusicTrack } from "@/src/features/music/types";
import { shuffledTracks } from "@/src/features/music/utils/shuffleTracks";

export type QueueEntry = { id: number; track: MusicTrack };
export type PlaybackQueue = { entries: QueueEntry[]; currentIndex: number };

export const emptyPlaybackQueue: PlaybackQueue = { entries: [], currentIndex: -1 };
export type RepeatMode = "off" | "all" | "one";

export function currentQueueEntry(queue: PlaybackQueue): QueueEntry | null {
  return queue.entries[queue.currentIndex] ?? null;
}

export function queueWithSelection(entries: QueueEntry[], selectedId: number): PlaybackQueue {
  const currentIndex = entries.findIndex((entry) => entry.id === selectedId);
  return currentIndex < 0 ? emptyPlaybackQueue : { entries, currentIndex };
}

export function appendToQueue(queue: PlaybackQueue, entry: QueueEntry): PlaybackQueue {
  if (queue.currentIndex < 0) return { entries: [entry], currentIndex: 0 };
  return { ...queue, entries: [...queue.entries, entry] };
}

export function insertNext(queue: PlaybackQueue, entry: QueueEntry): PlaybackQueue {
  if (queue.currentIndex < 0) return { entries: [entry], currentIndex: 0 };
  const entries = [...queue.entries];
  entries.splice(queue.currentIndex + 1, 0, entry);
  return { ...queue, entries };
}

export function stepQueue(queue: PlaybackQueue, direction: -1 | 1): PlaybackQueue {
  const nextIndex = queue.currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= queue.entries.length) return queue;
  return { ...queue, currentIndex: nextIndex };
}

export function shuffleUpcoming(queue: PlaybackQueue, random: () => number = Math.random): PlaybackQueue {
  if (queue.currentIndex < 0 || queue.currentIndex >= queue.entries.length - 2) return queue;
  const split = queue.currentIndex + 1;
  return { ...queue, entries: [...queue.entries.slice(0, split), ...shuffledTracks(queue.entries.slice(split), random)] };
}

export function restoreUpcoming(queue: PlaybackQueue, originalIds: number[]): PlaybackQueue {
  if (queue.currentIndex < 0) return queue;
  const rank = new Map(originalIds.map((id, index) => [id, index]));
  const split = queue.currentIndex + 1;
  const upcoming = queue.entries.slice(split).sort((a, b) =>
    (rank.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.id) ?? Number.MAX_SAFE_INTEGER));
  return { ...queue, entries: [...queue.entries.slice(0, split), ...upcoming] };
}

export function nextQueueForMode(queue: PlaybackQueue, repeat: RepeatMode, shuffle: boolean): PlaybackQueue {
  if (queue.currentIndex < 0) return queue;
  if (repeat === "one") return queue;
  const stepped = stepQueue(queue, 1);
  if (stepped !== queue || repeat !== "all") return stepped;
  if (!shuffle || queue.entries.length < 2) return { ...queue, currentIndex: 0 };
  const last = currentQueueEntry(queue)?.id;
  const entries = shuffledTracks(queue.entries);
  if (entries[0].id === last) [entries[0], entries[1]] = [entries[1], entries[0]];
  return { entries, currentIndex: 0 };
}

export function selectQueueEntry(queue: PlaybackQueue, id: number): PlaybackQueue {
  const index = queue.entries.findIndex((entry) => entry.id === id);
  return index < 0 || index === queue.currentIndex
    ? queue
    : { ...queue, currentIndex: index };
}

export function removeQueueEntry(queue: PlaybackQueue, id: number): PlaybackQueue {
  const index = queue.entries.findIndex((entry) => entry.id === id);
  if (index < 0) return queue;
  const entries = queue.entries.filter((entry) => entry.id !== id);
  if (!entries.length) return emptyPlaybackQueue;
  const currentIndex = index < queue.currentIndex
    ? queue.currentIndex - 1
    : index === queue.currentIndex
      ? Math.min(index, entries.length - 1)
      : queue.currentIndex;
  return { entries, currentIndex };
}

export function removeTrackFromQueue(queue: PlaybackQueue, trackId: string): PlaybackQueue {
  let next = queue;
  for (const entry of queue.entries) {
    if (entry.track.id === trackId) next = removeQueueEntry(next, entry.id);
  }
  return next;
}

export function clearUpcoming(queue: PlaybackQueue): PlaybackQueue {
  if (queue.currentIndex < 0) return queue;
  return {
    ...queue,
    entries: queue.entries.slice(0, queue.currentIndex + 1),
  };
}

export function moveUpcoming(
  queue: PlaybackQueue,
  id: number,
  direction: -1 | 1,
): PlaybackQueue {
  const index = queue.entries.findIndex((entry) => entry.id === id);
  const nextIndex = index + direction;
  if (index <= queue.currentIndex || nextIndex <= queue.currentIndex || nextIndex >= queue.entries.length) {
    return queue;
  }
  const entries = [...queue.entries];
  [entries[index], entries[nextIndex]] = [entries[nextIndex], entries[index]];
  return { ...queue, entries };
}
