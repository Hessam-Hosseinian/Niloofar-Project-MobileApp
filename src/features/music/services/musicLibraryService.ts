import * as DocumentPicker from "expo-document-picker";
import { requireOptionalNativeModule } from "expo";
import { Directory, File, Paths } from "expo-file-system";
import { Platform } from "react-native";

import {
  addImportedTrack,
  findImportedTrackByFingerprint,
  syncDeviceTracks,
  type DeviceTrackDraft,
} from "@/src/features/music/data/musicRepository";
import {
  getSupportedAudioExtension,
  titleFromFilename,
} from "@/src/features/music/utils/trackNames";

export type ImportResult = {
  added: number;
  duplicates: number;
  unsupported: number;
  failed: number;
  canceled: boolean;
};

export async function importLocalMusic(): Promise<ImportResult> {
  const result: ImportResult = {
    added: 0,
    duplicates: 0,
    unsupported: 0,
    failed: 0,
    canceled: false,
  };
  const selection = await DocumentPicker.getDocumentAsync({
    type: "audio/*",
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (selection.canceled) return { ...result, canceled: true };

  const directory = new Directory(Paths.document, "music");
  directory.create({ idempotent: true, intermediates: true });

  for (const asset of selection.assets) {
    const extension = getSupportedAudioExtension(asset.name, asset.mimeType);
    if (!extension) {
      result.unsupported++;
      continue;
    }

    let destination: File | null = null;
    try {
      const source = new File(asset.uri);
      if (!source.exists || source.size <= 0) throw new Error("Source file unavailable");
      const fingerprint = source.md5;
      if (fingerprint && await findImportedTrackByFingerprint(fingerprint)) {
        result.duplicates++;
        continue;
      }

      const id = `imported:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
      const storageName = `${id.replaceAll(":", "-")}.${extension}`;
      destination = new File(directory, storageName);
      await source.copy(destination);
      if (!destination.exists || destination.size <= 0) throw new Error("Copy failed");
      const savedFingerprint = fingerprint ?? destination.md5;
      if (savedFingerprint && await findImportedTrackByFingerprint(savedFingerprint)) {
        destination.delete();
        result.duplicates++;
        continue;
      }

      await addImportedTrack({
        id,
        storageName,
        filename: asset.name,
        title: titleFromFilename(asset.name),
        fileSize: destination.size,
        fingerprint: savedFingerprint,
      });
      result.added++;
    } catch (error) {
      console.warn("Music import failed", error);
      if (destination?.exists) destination.delete();
      result.failed++;
    }
  }
  return result;
}

async function performPhoneScan(): Promise<number> {
  if (Platform.OS !== "android") {
    throw new Error("Phone-wide music scanning is available on Android. Use Import files on iOS.");
  }

  // Do not evaluate expo-media-library's entrypoint in a stale native build:
  // it calls requireNativeModule at import time and would crash the route.
  if (!requireOptionalNativeModule("ExpoMediaLibraryNext")) {
    throw new Error("Phone scanning needs an updated Android build. Rebuild and reinstall Niloofar to add media access.");
  }

  let mediaLibrary: typeof import("expo-media-library");
  try {
    mediaLibrary = await import("expo-media-library");
  } catch (error) {
    if (String(error).includes("ExpoMediaLibraryNext")) {
      throw new Error("Phone scanning needs an updated Android build. Rebuild and reinstall Niloofar to add media access.");
    }
    throw error;
  }

  const { AssetField, MediaType, Query, requestPermissionsAsync } = mediaLibrary;
  const permission = await requestPermissionsAsync(false, ["audio"]);
  if (!permission.granted) {
    throw new Error("Audio access was not granted. Enable Music and audio access in Android settings, or import files instead.");
  }

  const found: DeviceTrackDraft[] = [];
  const pageSize = 200;
  for (let offset = 0; ; offset += pageSize) {
    const page = await new Query()
      .eq(AssetField.MEDIA_TYPE, MediaType.AUDIO)
      .orderBy(AssetField.CREATION_TIME)
      .limit(pageSize)
      .offset(offset)
      .exeForMetadata();
    for (const asset of page) {
      if (!asset.id || !asset.filename) continue;
      found.push({
        id: asset.id,
        filename: asset.filename,
        title: titleFromFilename(asset.filename),
        durationSeconds: asset.duration == null ? null : asset.duration / 1000,
      });
    }
    if (page.length < pageSize) break;
  }

  await syncDeviceTracks(found);
  return found.length;
}

let automaticScanAttempted = false;
let scanInFlight: Promise<number> | null = null;

export function scanPhoneMusic(): Promise<number> {
  if (scanInFlight) return scanInFlight;
  const scan = performPhoneScan();
  scanInFlight = scan;
  void scan.finally(() => {
    if (scanInFlight === scan) scanInFlight = null;
  }).catch(() => {});
  return scan;
}

export async function scanPhoneMusicAutomaticallyOnce(): Promise<number | null> {
  if (Platform.OS !== "android" || automaticScanAttempted) return null;
  automaticScanAttempted = true;
  return scanPhoneMusic();
}
