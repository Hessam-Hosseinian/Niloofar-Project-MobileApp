import { router } from "expo-router";
import {
  ArrowDown,
  Heart,
  ListMusic,
  Gauge,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  TriangleAlert,
} from "lucide-react-native";
import { useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { MusicArtwork } from "@/src/features/music/components/MusicArtwork";
import { MusicLyricsPanel } from "@/src/features/music/components/MusicLyricsPanel";
import { PlaybackProgress } from "@/src/features/music/components/PlaybackProgress";
import { useMusicPlayer } from "@/src/features/music/hooks/useMusicPlayer";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function NowPlayingScreen() {
  const insets = useSafeAreaInsets();
  const { currentTrack, queue, status, error, togglePlayback, seekTo, previous, next, toggleFavorite, playbackRate, setPlaybackRate, shuffleEnabled, toggleShuffle, repeatMode, cycleRepeatMode } =
    useMusicPlayer();
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const [speedOpen, setSpeedOpen] = useState(false);

  const onFavorite = () => {
    if (!currentTrack || favoriteBusy) return;
    setFavoriteBusy(true);
    void toggleFavorite(currentTrack.id)
      .then(() => setFavoriteError(null))
      .catch((caught: unknown) => {
        setFavoriteError(caught instanceof Error ? caught.message : "Could not update favorites.");
      })
      .finally(() => setFavoriteBusy(false));
  };

  return (<>
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
            <View style={styles.titleRow}>
              <Text
                numberOfLines={2}
                accessibilityRole="header"
                style={styles.trackTitle}
              >
                {currentTrack.title}
              </Text>
              {(currentTrack.sourceType === "imported" || currentTrack.sourceType === "device") && (
                <IconButton
                  accessibilityLabel={currentTrack.favorite ? "Remove from favorites" : "Add to favorites"}
                  variant="outline"
                  disabled={favoriteBusy}
                  icon={<Heart size={21} color={colors.foreground} fill={currentTrack.favorite ? colors.pink : "transparent"} />}
                  onPress={onFavorite}
                />
              )}
            </View>
            <Text numberOfLines={1} style={styles.artist}>
              {currentTrack.artist}
            </Text>
            {currentTrack.album && (
              <Text numberOfLines={1} style={styles.album}>
                {currentTrack.album}
              </Text>
            )}
            {favoriteError && <Text accessibilityRole="alert" style={styles.favoriteError}>{favoriteError}</Text>}
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
                disabled={queue.currentIndex >= queue.entries.length - 1 && repeatMode !== "all"}
                icon={<SkipForward size={21} color={colors.foreground} />}
                onPress={next}
              />
            </View>
            <View style={styles.modes}>
              <Button variant={shuffleEnabled ? "accent" : "outline"} size="small"
                accessibilityLabel={shuffleEnabled ? "Shuffle on" : "Shuffle off"}
                leftIcon={<Shuffle size={17} color={colors.foreground} />}
                onPress={toggleShuffle}>Shuffle {shuffleEnabled ? "on" : "off"}</Button>
              <Button variant={repeatMode === "off" ? "outline" : "accent"} size="small"
                accessibilityLabel={`Repeat ${repeatMode}`}
                leftIcon={repeatMode === "one" ? <Repeat1 size={17} color={colors.foreground} /> : <Repeat size={17} color={colors.foreground} />}
                onPress={cycleRepeatMode}>Repeat {repeatMode}</Button>
            </View>
            <Button
              variant="outline"
              leftIcon={<ListMusic size={18} color={colors.foreground} />}
              onPress={() => router.push("/(app)/service/music/queue" as never)}
            >
              Queue · {Math.max(queue.entries.length - queue.currentIndex - 1, 0)} up next
            </Button>
            <Button
              variant="outline"
              leftIcon={<Gauge size={18} color={colors.foreground} />}
              onPress={() => setSpeedOpen(true)}
            >Speed · {playbackRate}×</Button>
          </View>
          <Text style={styles.sourceLabel}>
            {currentTrack.sourceType === "device"
              ? "ON THIS PHONE"
              : currentTrack.sourceType === "imported"
                ? "IMPORTED TO NILOOFAR"
                : "LOCAL AUDIO"}
          </Text>
          {(currentTrack.sourceType === "device" || currentTrack.sourceType === "imported") &&
            <MusicLyricsPanel key={currentTrack.id} trackId={currentTrack.id} currentTime={status.currentTime} />}
        </View>
      )}
    </ScrollView>
    <Modal visible={speedOpen} transparent animationType="fade" onRequestClose={() => setSpeedOpen(false)}>
      <View style={styles.modalScrim}><View style={styles.modalCard}>
        <Text accessibilityRole="header" style={styles.headerTitle}>Playback speed</Text>
        {[0.75, 1, 1.25, 1.5, 2].map((rate) => <Pressable
          key={rate}
          accessibilityRole="button"
          accessibilityState={{ selected: rate === playbackRate }}
          onPress={() => { setPlaybackRate(rate); setSpeedOpen(false); }}
          style={[styles.speedOption, rate === playbackRate && styles.speedSelected]}
        ><Text style={styles.speedText}>{rate}×{rate === playbackRate ? " · Current" : ""}</Text></Pressable>)}
        <Button variant="outline" onPress={() => setSpeedOpen(false)}>Close</Button>
      </View></View>
    </Modal>
  </>);
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
  titleRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  trackTitle: {
    flex: 1,
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 30,
    lineHeight: 36,
    color: colors.foreground,
  },
  artist: { ...typography.h3, color: colors.muted },
  album: { ...typography.muted, color: colors.muted },
  favoriteError: { ...typography.muted, color: colors.destructive },
  transport: { width: "100%", gap: spacing.lg },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playButton: { minWidth: 162 },
  modes: { width: "100%", flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
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
  modalScrim: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: "rgba(0,0,0,0.55)" },
  modalCard: { gap: spacing.sm, padding: spacing.xl, backgroundColor: colors.background, borderWidth: 2, borderColor: colors.foreground },
  speedOption: { minHeight: 48, justifyContent: "center", paddingHorizontal: spacing.md, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white },
  speedSelected: { backgroundColor: colors.yellow },
  speedText: { ...typography.body, color: colors.foreground },
});
