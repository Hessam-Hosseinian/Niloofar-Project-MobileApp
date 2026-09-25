export type ListeningProgress = {
  entryId: number;
  heardSeconds: number;
  lastPosition: number | null;
  recorded: boolean;
};

export function newListeningProgress(entryId: number): ListeningProgress {
  return { entryId, heardSeconds: 0, lastPosition: null, recorded: false };
}

export function advanceListeningProgress(
  progress: ListeningProgress,
  status: { playing: boolean; currentTime: number; duration: number; didJustFinish: boolean },
): { progress: ListeningProgress; shouldRecord: boolean } {
  if (!status.playing && !status.didJustFinish) {
    return { progress: { ...progress, lastPosition: null }, shouldRecord: false };
  }

  const delta = progress.lastPosition === null ? 0 : status.currentTime - progress.lastPosition;
  const heardSeconds = progress.heardSeconds + (delta > 0 && delta <= 2 ? delta : 0);
  const duration = Number.isFinite(status.duration) && status.duration > 0 ? status.duration : 0;
  const threshold = duration > 0 ? Math.min(30, duration / 2) : 30;
  const shouldRecord = !progress.recorded && heardSeconds >= threshold;

  return {
    progress: {
      ...progress,
      heardSeconds,
      lastPosition: status.currentTime,
      recorded: progress.recorded || shouldRecord,
    },
    shouldRecord,
  };
}
