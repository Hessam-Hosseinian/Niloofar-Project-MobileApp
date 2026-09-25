import { FileText } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { getMusicLyrics, saveMusicLyrics } from "@/src/features/music/data/musicRepository";
import { importMusicLyrics } from "@/src/features/music/services/musicLyricsService";
import { activeLyricIndex, parseLrc } from "@/src/features/music/utils/lyrics";
import { colors, spacing, typography } from "@/src/theme";

type Props = { trackId: string; currentTime: number };

export function MusicLyricsPanel({ trackId, currentTime }: Props) {
  const [source, setSource] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let mounted = true;
    setSource(null);
    setError(null);
    void getMusicLyrics(trackId).then((value) => { if (mounted) setSource(value); })
      .catch((caught: unknown) => { if (mounted) setError(caught instanceof Error ? caught.message : "Could not load lyrics."); });
    return () => { mounted = false; };
  }, [trackId]);
  const lines = useMemo(() => source ? parseLrc(source) : [], [source]);
  const current = activeLyricIndex(lines, currentTime);
  const visible = lines.slice(Math.max(0, current - 1), Math.min(lines.length, current + 4));

  const importLyrics = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = await importMusicLyrics(trackId);
      if (next) { setSource(next); setError(null); }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not import lyrics.");
    } finally {
      setBusy(false);
    }
  };

  const removeLyrics = () => Alert.alert("Remove lyrics?", "Your song stays in the library.", [
    { text: "Cancel", style: "cancel" },
    { text: "Remove", style: "destructive", onPress: () => {
      void saveMusicLyrics(trackId, null).then(() => { setSource(null); setError(null); })
        .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not remove lyrics."));
    } },
  ]);

  return <View style={styles.panel}>
    <View style={styles.heading}>
      <FileText size={20} color={colors.foreground} />
      <Text accessibilityRole="header" style={styles.title}>Lyrics</Text>
    </View>
    {lines.length ? <View accessibilityLiveRegion="polite" style={styles.lines}>
      {visible.map((line, index) => {
        const absolute = Math.max(0, current - 1) + index;
        return <Text key={`${line.time}:${absolute}`} style={[styles.line, absolute === current && styles.activeLine]}>{line.text}</Text>;
      })}
    </View> : <Text style={styles.hint}>Bring your own timed .lrc file. Lyrics stay on this device.</Text>}
    {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    <View style={styles.actions}>
      <Button variant="outline" disabled={busy} onPress={() => void importLyrics()}>{lines.length ? "Replace .lrc" : "Import .lrc"}</Button>
      {lines.length > 0 && <Button variant="outline" onPress={removeLyrics}>Remove lyrics</Button>}
    </View>
  </View>;
}

const styles = StyleSheet.create({
  panel: { width: "100%", gap: spacing.md, padding: spacing.lg, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white },
  heading: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  title: { ...typography.h4, color: colors.foreground },
  hint: { ...typography.body, color: colors.muted },
  lines: { gap: spacing.sm, minHeight: 80, justifyContent: "center" },
  line: { ...typography.body, color: colors.muted },
  activeLine: { ...typography.h4, color: colors.foreground },
  error: { ...typography.muted, color: colors.destructive },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
