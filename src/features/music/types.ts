import type { AudioSource } from "expo-audio";

export type MusicSourceType = "bundled" | "imported" | "device" | "remote";

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  source: AudioSource;
  sourceType: MusicSourceType;
  favorite?: boolean;
};

export type LibraryTrack = MusicTrack & {
  filename: string;
  durationSeconds: number | null;
  available: boolean;
  favorite: boolean;
  playCount: number;
  addedAt: string;
  resumeSeconds: number;
};
