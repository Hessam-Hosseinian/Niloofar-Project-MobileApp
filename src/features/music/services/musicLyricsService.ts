import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";

import { saveMusicLyrics } from "@/src/features/music/data/musicRepository";
import { parseLrc } from "@/src/features/music/utils/lyrics";

export async function importMusicLyrics(trackId: string): Promise<string | null> {
  const selection = await DocumentPicker.getDocumentAsync({
    type: "*/*",
    copyToCacheDirectory: true,
  });
  if (selection.canceled) return null;
  const asset = selection.assets[0];
  if (!asset?.name.toLocaleLowerCase().endsWith(".lrc")) {
    throw new Error("Choose an .lrc lyrics file.");
  }
  const file = new File(asset.uri);
  if (!file.exists || file.size < 1 || file.size > 512 * 1024) {
    throw new Error("Lyrics file is empty, unavailable, or larger than 512 KB.");
  }
  const text = await file.text();
  if (!parseLrc(text).length) throw new Error("No timed lyric lines were found in this .lrc file.");
  await saveMusicLyrics(trackId, text);
  return text;
}
