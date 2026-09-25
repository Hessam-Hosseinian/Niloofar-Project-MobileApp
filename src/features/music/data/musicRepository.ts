import { File, Paths } from "expo-file-system";

import { getDatabase } from "@/src/db/database";
import type { LibraryTrack } from "@/src/features/music/types";

type MusicRow = {
  id: string;
  source_type: "imported" | "device";
  source_uri: string;
  storage_name: string | null;
  filename: string;
  title: string;
  artist: string;
  album: string | null;
  duration_seconds: number | null;
  file_size: number | null;
  fingerprint: string | null;
  favorite: number;
  play_count: number;
  hidden: number;
  missing: number;
};

const changeListeners = new Set<() => void>();

export function subscribeToMusicChanges(listener: () => void): () => void {
  changeListeners.add(listener);
  return () => { changeListeners.delete(listener); };
}

function notifyMusicChanged() {
  for (const listener of changeListeners) listener();
}

export type DeviceTrackDraft = {
  id: string;
  filename: string;
  title: string;
  durationSeconds: number | null;
};

export type ImportedTrackDraft = {
  id: string;
  storageName: string;
  filename: string;
  title: string;
  fileSize: number;
  fingerprint: string | null;
};

function toTrack(row: MusicRow): LibraryTrack {
  const file = row.storage_name
    ? new File(Paths.document, "music", row.storage_name)
    : null;
  const available = !row.missing && (file ? file.exists : true);
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    album: row.album ?? undefined,
    source: file?.uri ?? row.source_uri,
    sourceType: row.source_type,
    filename: row.filename,
    durationSeconds: row.duration_seconds,
    available,
    favorite: row.favorite === 1,
    playCount: row.play_count,
  };
}

export async function getLibraryTracks(): Promise<LibraryTrack[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MusicRow>(
    "SELECT * FROM music_tracks WHERE hidden = 0 ORDER BY title COLLATE NOCASE, id",
  );
  return rows.map(toTrack);
}

export async function getFavoriteTracks(limit?: number): Promise<LibraryTrack[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MusicRow>(
    `SELECT * FROM music_tracks WHERE hidden = 0 AND favorite = 1
      ORDER BY title COLLATE NOCASE, id ${limit ? "LIMIT ?" : ""}`,
    ...(limit ? [limit] : []),
  );
  return rows.map(toTrack);
}

export async function getRecentlyPlayedTracks(limit?: number): Promise<LibraryTrack[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MusicRow>(
    `SELECT music_tracks.* FROM music_tracks
      JOIN (SELECT track_id, MAX(id) AS last_play_id FROM music_play_history GROUP BY track_id) recent
        ON recent.track_id = music_tracks.id
      WHERE music_tracks.hidden = 0
      ORDER BY recent.last_play_id DESC ${limit ? "LIMIT ?" : ""}`,
    ...(limit ? [limit] : []),
  );
  return rows.map(toTrack);
}

export async function toggleMusicFavorite(id: string): Promise<boolean> {
  const db = await getDatabase();
  const favorite = await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      "UPDATE music_tracks SET favorite = 1 - favorite WHERE id = ? AND hidden = 0",
      id,
    );
    const row = await tx.getFirstAsync<{ favorite: number }>(
      "SELECT favorite FROM music_tracks WHERE id = ? AND hidden = 0",
      id,
    );
    if (!row) throw new Error("This song is no longer in your library.");
    return row.favorite === 1;
  });
  notifyMusicChanged();
  return favorite;
}

export async function recordMusicPlay(trackId: string): Promise<void> {
  const db = await getDatabase();
  const recorded = await db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync(
      "UPDATE music_tracks SET play_count = play_count + 1 WHERE id = ? AND hidden = 0",
      trackId,
    );
    if (result.changes === 0) return false;
    await tx.runAsync(
      "INSERT INTO music_play_history (track_id, played_at) VALUES (?, ?)",
      trackId,
      new Date().toISOString(),
    );
    return true;
  });
  if (recorded) notifyMusicChanged();
}

export async function getHiddenDeviceTrackCount(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) AS count FROM music_tracks WHERE source_type = 'device' AND hidden = 1",
  );
  return row?.count ?? 0;
}

export async function findImportedTrackByFingerprint(fingerprint: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ id: string; storage_name: string | null }>(
    "SELECT id, storage_name FROM music_tracks WHERE source_type = 'imported' AND fingerprint = ? LIMIT 1",
    fingerprint,
  );
  if (!row) return null;
  if (row.storage_name && new File(Paths.document, "music", row.storage_name).exists) {
    return row;
  }
  await db.runAsync("DELETE FROM music_tracks WHERE id = ?", row.id);
  return null;
}

export async function addImportedTrack(track: ImportedTrackDraft) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO music_tracks
      (id, source_type, source_uri, storage_name, filename, title, artist, file_size, fingerprint, created_at, updated_at)
      VALUES (?, 'imported', ?, ?, ?, ?, 'Unknown artist', ?, ?, ?, ?)`,
    track.id,
    track.storageName,
    track.storageName,
    track.filename,
    track.title,
    track.fileSize,
    track.fingerprint,
    now,
    now,
  );
}

export async function syncDeviceTracks(tracks: DeviceTrackDraft[]) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      "UPDATE music_tracks SET missing = 1 WHERE source_type = 'device'",
    );
    for (const track of tracks) {
      await tx.runAsync(
        `INSERT INTO music_tracks
          (id, source_type, source_uri, filename, title, artist, duration_seconds, created_at, updated_at)
          VALUES (?, 'device', ?, ?, ?, 'Unknown artist', ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            source_uri = excluded.source_uri,
            filename = excluded.filename,
            title = excluded.title,
            duration_seconds = excluded.duration_seconds,
            missing = 0,
            updated_at = excluded.updated_at`,
        `device:${track.id}`,
        track.id,
        track.filename,
        track.title,
        track.durationSeconds,
        now,
        now,
      );
    }
  });
}

export async function removeLibraryTrack(id: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<MusicRow>(
    "SELECT * FROM music_tracks WHERE id = ? LIMIT 1",
    id,
  );
  if (!row) return;

  if (row.source_type === "device") {
    await db.runAsync("UPDATE music_tracks SET hidden = 1 WHERE id = ?", id);
    return;
  }

  await db.runAsync("DELETE FROM music_tracks WHERE id = ?", id);
  if (row.storage_name) {
    const file = new File(Paths.document, "music", row.storage_name);
    if (file.exists) file.delete();
  }
}

export async function restoreHiddenDeviceTracks() {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE music_tracks SET hidden = 0 WHERE source_type = 'device'",
  );
}
