import { Disc3, Pause, Play, RotateCcw, TriangleAlert } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { Surface } from "@/src/components/ui/Surface";
import { PlaybackProgress } from "@/src/features/music/components/PlaybackProgress";
import { developmentTrack } from "@/src/features/music/data/developmentTrack";
import { useMusicPlayer } from "@/src/features/music/hooks/useMusicPlayer";
import { colors, radius, spacing, typography } from "@/src/theme";

export function AudioCoreCard() {
  const {
    currentTrack,
    status,
    error,
    playTrack,
    togglePlayback,
    seekTo,
    restart,
  } = useMusicPlayer();
  const isDevelopmentTrack = currentTrack?.id === developmentTrack.id;
  const isLoading = isDevelopmentTrack && !status.isLoaded && !error;
  const finished =
    isDevelopmentTrack &&
    status.duration > 0 &&
    status.currentTime >= status.duration - 0.1;

  const stateLabel = error
    ? "Playback error"
    : isLoading
      ? "Loading audio"
    : status.isBuffering
      ? "Buffering"
      : status.playing
        ? "Playing"
        : finished
          ? "Finished"
          : isDevelopmentTrack
            ? "Paused"
            : "Ready to test";

  async function handlePrimaryAction() {
    if (!isDevelopmentTrack || error) {
      playTrack(developmentTrack);
      return;
    }

    await togglePlayback();
  }

  return (
    <Surface shadow="md" contentStyle={styles.surface}>
      <View style={styles.trackRow}>
        <View style={styles.artworkWrapper}>
          <View style={styles.artworkShadow} />
          <View style={styles.artwork}>
            <Disc3 size={32} strokeWidth={1.9} color={colors.foreground} />
          </View>
        </View>

        <View style={styles.trackCopy}>
          <Text style={styles.kicker}>DEVELOPMENT AUDIO</Text>
          <Text numberOfLines={1} style={styles.title}>
            {isDevelopmentTrack ? currentTrack.title : developmentTrack.title}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {isDevelopmentTrack ? currentTrack.artist : developmentTrack.artist}
          </Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusDot,
            status.playing && styles.statusDotPlaying,
            error && styles.statusDotError,
          ]}
        />
        <Text style={styles.statusText}>{stateLabel}</Text>
      </View>

      {isDevelopmentTrack && (
        <PlaybackProgress
          currentTime={status.currentTime}
          duration={status.duration}
          disabled={!status.isLoaded || !!error}
          onSeek={(seconds) => void seekTo(seconds)}
        />
      )}

      {error && (
        <View accessibilityRole="alert" style={styles.errorBanner}>
          <TriangleAlert size={19} color={colors.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.actions}>
        <Button
          variant="accent"
          loading={isLoading}
          onPress={() => void handlePrimaryAction()}
          leftIcon={
            status.playing && isDevelopmentTrack ? (
              <Pause size={19} fill={colors.foreground} color={colors.foreground} />
            ) : (
              <Play size={19} fill={colors.foreground} color={colors.foreground} />
            )
          }
          style={styles.primaryAction}
        >
          {status.playing && isDevelopmentTrack
            ? "Pause"
            : finished
              ? "Play again"
              : "Play test tone"}
        </Button>

        {isDevelopmentTrack && (
          <IconButton
            accessibilityLabel="Restart test tone"
            variant="outline"
            disabled={!status.isLoaded || !!error}
            icon={<RotateCcw size={19} color={colors.foreground} />}
            onPress={() => void restart()}
          />
        )}
      </View>

      <Text style={styles.helper}>
        This original 12-second tone lets you check loading, playback, pause,
        progress, and seeking before device music scanning is added.
      </Text>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  artworkWrapper: {
    width: 68,
    height: 68,
    position: "relative",
  },
  artworkShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 64,
    height: 64,
    backgroundColor: colors.foreground,
    borderRadius: radius.sm,
  },
  artwork: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  trackCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    ...typography.label,
    fontSize: 11,
    color: colors.muted,
  },
  title: {
    ...typography.h4,
    marginTop: spacing.xs,
    color: colors.foreground,
  },
  artist: {
    ...typography.muted,
    color: colors.muted,
  },
  statusRow: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 9,
    height: 9,
    backgroundColor: colors.muted,
    borderRadius: 5,
  },
  statusDotPlaying: {
    backgroundColor: colors.green,
  },
  statusDotError: {
    backgroundColor: colors.destructive,
  },
  statusText: {
    ...typography.muted,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
  errorBanner: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.destructive,
    borderRadius: radius.sm,
  },
  errorText: {
    ...typography.muted,
    flex: 1,
    color: colors.destructive,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  primaryAction: {
    flex: 1,
  },
  helper: {
    ...typography.muted,
    color: colors.muted,
  },
});
