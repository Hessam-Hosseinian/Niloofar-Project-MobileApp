import { getDatabase } from "@/src/db/database";
import {
  musicRowToTrack,
  type MusicRow,
} from "@/src/features/music/data/musicRepository";
import type { LibraryTrack } from "@/src/features/music/types";

export type MusicPlaylist = {
  id: string;
  name: string;
  trackCount: number;
  createdAt: string;
  updatedAt: string;
};

type PlaylistRow = {
  id: string;
  name: string;
  track_count: number;
  created_at: string;
  updated_at: string;
};

function toPlaylist(row: PlaylistRow): MusicPlaylist {
  return {
    id: row.id,
    name: row.name,
    trackCount: row.track_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validatedName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Give your playlist a name.");
  if (trimmed.length > 80) throw new Error("Playlist names can be at most 80 characters.");
  return trimmed;
}

export async function getMusicPlaylists(): Promise<MusicPlaylist[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<PlaylistRow>(
    `SELECT p.*, COUNT(t.id) AS track_count
      FROM music_playlists p
      LEFT JOIN music_playlist_tracks pt ON pt.playlist_id = p.id
      LEFT JOIN music_tracks t ON t.id = pt.track_id AND t.hidden = 0
      GROUP BY p.id
      ORDER BY p.updated_at DESC, p.name COLLATE NOCASE`,
  );
  return rows.map(toPlaylist);
}

export async function getMusicPlaylist(id: string): Promise<MusicPlaylist | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<PlaylistRow>(
    `SELECT p.*, COUNT(t.id) AS track_count
      FROM music_playlists p
      LEFT JOIN music_playlist_tracks pt ON pt.playlist_id = p.id
      LEFT JOIN music_tracks t ON t.id = pt.track_id AND t.hidden = 0
      WHERE p.id = ? GROUP BY p.id`,
    id,
  );
  return row ? toPlaylist(row) : null;
}

export async function getMusicPlaylistTracks(id: string): Promise<LibraryTrack[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<MusicRow>(
    `SELECT t.* FROM music_playlist_tracks pt
      JOIN music_tracks t ON t.id = pt.track_id
      WHERE pt.playlist_id = ? AND t.hidden = 0
      ORDER BY pt.position, pt.rowid`,
    id,
  );
  return rows.map(musicRowToTrack);
}

export async function createMusicPlaylist(name: string): Promise<string> {
  const db = await getDatabase();
  const id = `playlist:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  const now = new Date().toISOString();
  await db.runAsync(
    "INSERT INTO music_playlists (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)",
    id, validatedName(name), now, now,
  );
  return id;
}

export async function renameMusicPlaylist(id: string, name: string): Promise<void> {
  const db = await getDatabase();
  const result = await db.runAsync(
    "UPDATE music_playlists SET name = ?, updated_at = ? WHERE id = ?",
    validatedName(name), new Date().toISOString(), id,
  );
  if (result.changes === 0) throw new Error("Playlist not found.");
}

export async function deleteMusicPlaylist(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync("DELETE FROM music_playlists WHERE id = ?", id);
}

export async function addTrackToMusicPlaylist(playlistId: string, trackId: string): Promise<boolean> {
  const db = await getDatabase();
  return db.withExclusiveTransactionAsync(async (tx) => {
    const result = await tx.runAsync(
      `INSERT OR IGNORE INTO music_playlist_tracks (playlist_id, track_id, position, added_at)
        SELECT ?, id,
          COALESCE((SELECT MAX(position) + 1 FROM music_playlist_tracks WHERE playlist_id = ?), 0), ?
        FROM music_tracks WHERE id = ? AND hidden = 0`,
      playlistId, playlistId, new Date().toISOString(), trackId,
    );
    if (result.changes > 0) {
      await tx.runAsync(
        "UPDATE music_playlists SET updated_at = ? WHERE id = ?",
        new Date().toISOString(), playlistId,
      );
    }
    return result.changes > 0;
  });
}

export async function removeTrackFromMusicPlaylist(playlistId: string, trackId: string): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync(
      "DELETE FROM music_playlist_tracks WHERE playlist_id = ? AND track_id = ?",
      playlistId, trackId,
    );
    await tx.runAsync(
      "UPDATE music_playlists SET updated_at = ? WHERE id = ?",
      new Date().toISOString(), playlistId,
    );
  });
}

export async function moveMusicPlaylistTrack(
  playlistId: string,
  trackId: string,
  direction: -1 | 1,
): Promise<void> {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    const rows = await tx.getAllAsync<{ track_id: string; position: number }>(
      `SELECT pt.track_id, pt.position FROM music_playlist_tracks pt
        JOIN music_tracks t ON t.id = pt.track_id
        WHERE pt.playlist_id = ? AND t.hidden = 0
        ORDER BY pt.position, pt.rowid`,
      playlistId,
    );
    const index = rows.findIndex((row) => row.track_id === trackId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= rows.length) return;
    await tx.runAsync(
      "UPDATE music_playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?",
      rows[target].position, playlistId, rows[index].track_id,
    );
    await tx.runAsync(
      "UPDATE music_playlist_tracks SET position = ? WHERE playlist_id = ? AND track_id = ?",
      rows[index].position, playlistId, rows[target].track_id,
    );
    await tx.runAsync(
      "UPDATE music_playlists SET updated_at = ? WHERE id = ?",
      new Date().toISOString(), playlistId,
    );
  });
}
