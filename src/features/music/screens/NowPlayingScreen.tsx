import { router } from "expo-router";
import {
  ArrowDown,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  TriangleAlert,
} from "lucide-react-native";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { MusicArtwork } from "@/src/features/music/components/MusicArtwork";
import { PlaybackProgress } from "@/src/features/music/components/PlaybackProgress";
import { useMusicPlayer } from "@/src/features/music/hooks/useMusicPlayer";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const { currentTrack, queue, status, error, togglePlayback, seekTo, previous, next } =
    useMusicPlayer();

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Close player"
          variant="outline"
          icon={<ArrowDown size={20} color={colors.foreground} />}
          onPress={() => router.back()}
        />
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>NILOOFAR MUSIC</Text>
          <Text style={styles.headerTitle}>Now Playing</Text>
        </View>
      </View>

      {!currentTrack ? (
        <View style={styles.empty}>
          <MusicArtwork seed="empty player" size={150} />
          <Text style={styles.emptyTitle}>Nothing playing yet</Text>
          <Text style={styles.emptyText}>
            Choose a song from your library to make this space yours.
          </Text>
          <Button
            variant="accent"
            onPress={() =>
              router.replace("/(app)/service/music/library" as never)
            }
          >
            Open library
          </Button>
        </View>
      ) : (
        <View style={styles.player}>
          <View style={styles.artworkFrame}>
            <View style={styles.artworkShadow} />
            <MusicArtwork
              seed={`${currentTrack.title}:${currentTrack.artist}`}
              size={260}
            />
          </View>

          <View style={styles.metadata}>
            <Text
              numberOfLines={2}
              accessibilityRole="header"
              style={styles.trackTitle}
            >
              {currentTrack.title}
            </Text>
            <Text numberOfLines={1} style={styles.artist}>
              {currentTrack.artist}
            </Text>
            {currentTrack.album && (
              <Text numberOfLines={1} style={styles.album}>
                {currentTrack.album}
              </Text>
            )}
          </View>

          <View style={styles.transport}>
            {error && (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <TriangleAlert size={18} color={colors.destructive} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            <PlaybackProgress
              currentTime={status.currentTime}
              duration={status.duration}
              disabled={!status.isLoaded || !!error}
              onSeek={(seconds) => void seekTo(seconds)}
            />
            <View style={styles.controls}>
              <IconButton
                accessibilityLabel="Previous song or restart"
                variant="outline"
                disabled={!status.isLoaded || !!error}
                icon={<SkipBack size={21} color={colors.foreground} />}
                onPress={previous}
              />
              <Button
                variant="accent"
                size="large"
                loading={!status.isLoaded && !error}
                disabled={!!error}
                accessibilityLabel={status.playing ? "Pause" : "Play"}
                leftIcon={
                  status.playing ? (
                    <Pause
                      size={23}
                      fill={colors.foreground}
                      color={colors.foreground}
                    />
                  ) : (
                    <Play
                      size={23}
                      fill={colors.foreground}
                      color={colors.foreground}
                    />
                  )
                }
                onPress={() => void togglePlayback()}
                style={styles.playButton}
              >
                {status.playing ? "Pause" : "Play"}
              </Button>
              <IconButton
                accessibilityLabel="Next song"
                variant="outline"
                disabled={queue.currentIndex >= queue.entries.length - 1}
                icon={<SkipForward size={21} color={colors.foreground} />}
                onPress={next}
              />
            </View>
            <Button
              variant="outline"
              leftIcon={<ListMusic size={18} color={colors.foreground} />}
              onPress={() => router.push("/(app)/service/music/queue" as never)}
            >
              Queue · {Math.max(queue.entries.length - queue.currentIndex - 1, 0)} up next
            </Button>
          </View>
          <Text style={styles.sourceLabel}>
            {currentTrack.sourceType === "device"
              ? "ON THIS PHONE"
              : currentTrack.sourceType === "imported"
                ? "IMPORTED TO NILOOFAR"
                : "LOCAL AUDIO"}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headerCopy: { flex: 1 },
  kicker: { ...typography.label, color: colors.muted },
  headerTitle: { ...typography.h4, color: colors.foreground },
  player: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxl,
  },
  artworkFrame: {
    width: 270,
    height: 270,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  artworkShadow: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 260,
    height: 260,
    backgroundColor: colors.foreground,
    borderRadius: radius.sm,
  },
  metadata: { width: "100%", gap: spacing.xs },
  trackTitle: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 30,
    lineHeight: 36,
    color: colors.foreground,
  },
  artist: { ...typography.h3, color: colors.muted },
  album: { ...typography.muted, color: colors.muted },
  transport: { width: "100%", gap: spacing.lg },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playButton: { minWidth: 162 },
  sourceLabel: {
    ...typography.label,
    color: colors.muted,
    alignSelf: "flex-start",
  },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  errorText: { ...typography.muted, flex: 1, color: colors.destructive },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  emptyTitle: {
    ...typography.h2,
    color: colors.foreground,
    textAlign: "center",
  },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center" },
});
