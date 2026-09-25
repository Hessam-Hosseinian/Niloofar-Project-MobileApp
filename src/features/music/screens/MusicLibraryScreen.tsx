import { router } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { EmptyLibraryState } from "@/src/features/music/components/EmptyLibraryState";
import { LibraryActions } from "@/src/features/music/components/LibraryActions";
import { MusicTrackRow } from "@/src/features/music/components/MusicTrackRow";
import { removeLibraryTrack } from "@/src/features/music/data/musicRepository";
import { useMusicLibrary } from "@/src/features/music/hooks/useMusicLibrary";
import { useMusicPlayerActions } from "@/src/features/music/hooks/useMusicPlayerActions";
import type { LibraryTrack } from "@/src/features/music/types";
import { colors, spacing, typography } from "@/src/theme";

export default function MusicLibraryScreen() {
  const insets = useSafeAreaInsets();
  const library = useMusicLibrary();
  const { playFromList, playNext, addToQueue, toggleFavorite, clearTrack } = useMusicPlayerActions();
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "favorites" | "recent">("all");
  const visibleTracks = filter === "favorites"
    ? library.favoriteTracks
    : filter === "recent"
      ? library.recentTracks
      : library.tracks;

  const remove = useCallback((track: LibraryTrack) => {
    const isDevice = track.sourceType === "device";
    Alert.alert(
      isDevice ? "Exclude song?" : "Remove imported song?",
      isDevice
        ? "The phone file stays untouched. You can restore excluded songs later."
        : "Only Niloofar's imported copy will be deleted.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: isDevice ? "Exclude" : "Remove",
          style: "destructive",
          onPress: () => {
            void (async () => {
              try {
                await removeLibraryTrack(track.id);
                clearTrack(track.id);
                setActionError(null);
              } catch (error) {
                setActionError(error instanceof Error ? error.message : "Could not remove this song.");
              } finally {
                await library.refresh();
              }
            })();
          },
        },
      ],
    );
  }, [clearTrack, library]);

  const playSong = useCallback((track: LibraryTrack) => {
    playFromList(track, library.tracks.filter((song) => song.available));
  }, [library.tracks, playFromList]);

  const favoriteSong = useCallback((track: LibraryTrack) => {
    void toggleFavorite(track.id)
      .then(() => setActionError(null))
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not update favorites.");
      });
  }, [toggleFavorite]);

  const showOptions = useCallback((track: LibraryTrack) => {
    Alert.alert(track.title, track.artist, [
      { text: "Cancel", style: "cancel" },
      ...(track.available ? [
        { text: "Play next", onPress: () => playNext(track) },
        { text: "Add to queue", onPress: () => addToQueue(track) },
      ] : []),
      { text: track.sourceType === "device" ? "Exclude from library" : "Remove import", onPress: () => remove(track) },
    ]);
  }, [addToQueue, playNext, remove]);

  const renderItem = useCallback(({ item }: { item: LibraryTrack }) => (
    <MusicTrackRow track={item} onPlay={playSong} onOptions={showOptions} onFavorite={favoriteSong} />
  ), [favoriteSong, playSong, showOptions]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.lg }]}
      data={visibleTracks}
      keyExtractor={(track) => track.id}
      renderItem={renderItem}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={
        <View style={styles.headerBlock}>
          <View style={styles.header}>
            <IconButton
              accessibilityLabel="Go back"
              variant="outline"
              icon={<ArrowLeft size={20} color={colors.foreground} />}
              onPress={() => router.back()}
            />
            <View style={styles.headingCopy}>
              <Text style={styles.kicker}>YOUR COLLECTION</Text>
              <Text accessibilityRole="header" style={styles.title}>Songs</Text>
            </View>
            <Text style={styles.count}>{visibleTracks.length}</Text>
          </View>
          <LibraryActions
            busy={library.busy}
            message={library.message}
            error={library.error ?? actionError}
            onScan={() => void library.scan()}
            onImport={() => void library.importFiles()}
          />
          {library.hiddenCount > 0 && (
            <Button
              variant="outline"
              onPress={() => void library.restoreHidden()}
              leftIcon={<RotateCcw size={17} color={colors.foreground} />}
            >Restore {library.hiddenCount} excluded</Button>
          )}
          <View style={styles.filters}>
            {(["all", "favorites", "recent"] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === option }}
                onPress={() => setFilter(option)}
                style={[styles.filter, filter === option && styles.activeFilter]}
              >
                <Text style={styles.filterText}>
                  {option === "all" ? "All songs" : option === "favorites" ? "Favorites" : "Recent"}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.sectionTitle}>
            {filter === "all" ? "All songs" : filter === "favorites" ? "Favorites" : "Recently played"}
          </Text>
        </View>
      }
      ListEmptyComponent={library.loading ? null : filter === "all" ? <EmptyLibraryState /> : (
        <Text style={styles.filterEmpty}>
          {filter === "favorites" ? "Tap the heart on a song to keep it here." : "Songs you listen to will appear here."}
        </Text>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: spacing.xl },
  headerBlock: { gap: spacing.xl, marginBottom: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headingCopy: { flex: 1 },
  kicker: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  count: { ...typography.h3, color: colors.foreground },
  sectionTitle: { ...typography.h3, color: colors.foreground },
  separator: { height: spacing.sm },
  filters: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  filter: {
    minHeight: 40,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderWidth: 2,
    borderColor: colors.foreground,
    backgroundColor: colors.white,
  },
  activeFilter: { backgroundColor: colors.yellow },
  filterText: { ...typography.label, color: colors.foreground },
  filterEmpty: { ...typography.body, color: colors.muted },
});
