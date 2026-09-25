import { router } from "expo-router";
import { Pause, Play } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MusicArtwork } from "@/src/features/music/components/MusicArtwork";
import { useMusicPlayer } from "@/src/features/music/hooks/useMusicPlayer";
import { colors, radius, spacing, typography } from "@/src/theme";

type Props = { embedded?: boolean };

export function MusicMiniPlayer({ embedded = false }: Props) {
  const insets = useSafeAreaInsets();
  const { currentTrack, status, togglePlayback } = useMusicPlayer();
  if (!currentTrack) return null;

  const progress = status.duration > 0
    ? Math.min(Math.max(status.currentTime / status.duration, 0), 1)
    : 0;

  return (
    <View style={[styles.container, !embedded && { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open player for ${currentTrack.title}`}
          onPress={() => router.push("/(app)/service/music/now-playing" as never)}
          style={styles.main}
        >
          <MusicArtwork seed={`${currentTrack.title}:${currentTrack.artist}`} size={42} />
          <View style={styles.copy}>
            <Text numberOfLines={1} style={styles.title}>{currentTrack.title}</Text>
            <Text numberOfLines={1} style={styles.artist}>{currentTrack.artist}</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={status.playing ? "Pause music" : "Play music"}
          accessibilityState={{ disabled: !status.isLoaded || !!status.error }}
          disabled={!status.isLoaded || !!status.error}
          onPress={() => void togglePlayback()}
          style={styles.playControl}
        >
          {status.playing
            ? <Pause size={23} fill={colors.foreground} color={colors.foreground} />
            : <Play size={23} fill={colors.foreground} color={colors.foreground} />}
        </Pressable>
        <View pointerEvents="none" style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: spacing.sm, backgroundColor: colors.background },
  card: {
    minHeight: 62, flexDirection: "row", alignItems: "center", overflow: "hidden",
    backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  main: { flex: 1, minWidth: 0, minHeight: 60, flexDirection: "row", alignItems: "center", gap: spacing.md, paddingLeft: spacing.sm },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.h4, color: colors.foreground },
  artist: { ...typography.muted, color: colors.muted },
  playControl: { width: 56, minHeight: 56, alignItems: "center", justifyContent: "center" },
  progressTrack: { position: "absolute", bottom: 0, left: 0, right: 0, height: 4, backgroundColor: colors.background },
  progressFill: { height: 4, backgroundColor: colors.green },
});
