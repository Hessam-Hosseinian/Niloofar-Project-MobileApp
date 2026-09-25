const supportedExtensions = new Set([
  "mp3", "m4a", "aac", "wav", "flac", "ogg", "opus", "aiff", "aif",
]);

const mimeExtensions: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/aac": "aac",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/flac": "flac",
  "audio/ogg": "ogg",
  "audio/opus": "opus",
  "audio/aiff": "aiff",
};

export function getSupportedAudioExtension(filename: string, mimeType?: string | null) {
  const extension = filename.split(".").at(-1)?.toLowerCase() ?? "";
  if (supportedExtensions.has(extension)) return extension;
  if (extension && filename.includes(".")) return null;
  return mimeType ? mimeExtensions[mimeType.toLowerCase()] ?? null : null;
}

export function titleFromFilename(filename: string) {
  const basename = filename.replace(/\.[^.]+$/, "").trim();
  return basename || "Untitled audio";
}
