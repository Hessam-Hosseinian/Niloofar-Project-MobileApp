import type { MusicTrack } from "@/src/features/music/types";

export const developmentTrack: MusicTrack = {
  id: "niloofar-development-tone",
  title: "Niloofar Test Tone",
  artist: "Original development audio",
  album: "Audio Core Preview",
  source: require("../../../../assets/audio/niloofar-test-tone.m4a"),
  sourceType: "bundled",
};
