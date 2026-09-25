import type { AudioSource } from "expo-audio";

export type MusicSourceType = "bundled" | "imported" | "device" | "remote";

export type MusicTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string;
  source: AudioSource;
  sourceType: MusicSourceType;
};

export type LibraryTrack = MusicTrack & {
  filename: string;
  durationSeconds: number | null;
  available: boolean;
};
