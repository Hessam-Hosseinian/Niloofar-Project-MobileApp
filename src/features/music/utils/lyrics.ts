export type LyricLine = { time: number; text: string };

export function parseLrc(input: string): LyricLine[] {
  const result: LyricLine[] = [];
  for (const line of input.replace(/^\uFEFF/, "").split(/\r?\n/)) {
    const stamps = [...line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    if (!stamps.length) continue;
    const text = line.replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g, "").trim();
    if (!text) continue;
    for (const stamp of stamps) {
      const minutes = Number(stamp[1]);
      const seconds = Number(stamp[2]);
      if (seconds >= 60) continue;
      const fraction = stamp[3] ? Number(`0.${stamp[3]}`) : 0;
      result.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }
  return result.sort((a, b) => a.time - b.time);
}

export function activeLyricIndex(lines: LyricLine[], seconds: number): number {
  let left = 0;
  let right = lines.length;
  while (left < right) {
    const middle = (left + right) >>> 1;
    if (lines[middle].time <= seconds) left = middle + 1;
    else right = middle;
  }
  return left - 1;
}
