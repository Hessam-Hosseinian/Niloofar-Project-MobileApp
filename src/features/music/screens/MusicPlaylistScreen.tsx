import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ListMusic, Pencil, Play, Plus, Shuffle, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { PlaylistNameDialog } from "@/src/features/music/components/PlaylistNameDialog";
import { PlaylistTrackItem } from "@/src/features/music/components/PlaylistTrackItem";
import {
  deleteMusicPlaylist,
  getMusicPlaylist,
  getMusicPlaylistTracks,
  moveMusicPlaylistTrack,
  removeTrackFromMusicPlaylist,
  renameMusicPlaylist,
  type MusicPlaylist,
} from "@/src/features/music/data/musicPlaylistRepository";
import { useMusicPlayerActions } from "@/src/features/music/hooks/useMusicPlayerActions";
import type { LibraryTrack } from "@/src/features/music/types";
import { shuffledTracks } from "@/src/features/music/utils/shuffleTracks";
import { colors, spacing, typography } from "@/src/theme";

export default function MusicPlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { playFromList, toggleFavorite } = useMusicPlayerActions();
  const [playlist, setPlaylist] = useState<MusicPlaylist | null>(null);
  const [tracks, setTracks] = useState<LibraryTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const [nextPlaylist, nextTracks] = await Promise.all([
        getMusicPlaylist(id), getMusicPlaylistTracks(id),
      ]);
      setPlaylist(nextPlaylist);
      setTracks(nextTracks);
      setError(nextPlaylist ? null : "Playlist not found.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load playlist.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const playSong = useCallback((track: LibraryTrack) => {
    playFromList(track, tracks.filter((song) => song.available));
  }, [playFromList, tracks]);

  const playAll = () => {
    const playable = tracks.filter((track) => track.available);
    if (playable.length) playFromList(playable[0], playable);
  };

  const shuffleAll = () => {
    const playable = shuffledTracks(tracks.filter((track) => track.available));
    if (playable.length) playFromList(playable[0], playable);
  };

  const favoriteSong = (track: LibraryTrack) => {
    void toggleFavorite(track.id)
      .then(refresh)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not update favorites."));
  };

  const moveSong = (track: LibraryTrack, direction: -1 | 1) => {
    void moveMusicPlaylistTrack(id, track.id, direction)
      .then(refresh)
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not reorder playlist."));
  };

  const removeSong = (track: LibraryTrack) => {
    Alert.alert("Remove from playlist?", `${track.title} will remain in your music library.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove", style: "destructive",
        onPress: () => {
          void removeTrackFromMusicPlaylist(id, track.id)
            .then(refresh)
            .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not remove song."));
        },
      },
    ]);
  };

  const rename = async (name: string) => {
    await renameMusicPlaylist(id, name);
    setRenaming(false);
    await refresh();
  };

  const confirmDelete = () => {
    Alert.alert("Delete playlist?", "The songs will stay in your library.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: () => {
          void deleteMusicPlaylist(id)
            .then(() => router.replace("/(app)/service/music/playlists" as never))
            .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not delete playlist."));
        },
      },
    ]);
  };

  const renderItem = ({ item, index }: { item: LibraryTrack; index: number }) => (
    <PlaylistTrackItem
      track={item}
      index={index}
      count={tracks.length}
      onPlay={playSong}
      onFavorite={favoriteSong}
      onMove={moveSong}
      onRemove={removeSong}
    />
  );

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xl }]}
        data={tracks}
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
              <Text style={styles.kicker}>YOUR PLAYLIST</Text>
            </View>
            {loading ? <ActivityIndicator color={colors.foreground} /> : playlist && (
              <>
                <Text accessibilityRole="header" style={styles.title}>{playlist.name}</Text>
                <Text style={styles.meta}>{tracks.length} song{tracks.length === 1 ? "" : "s"}</Text>
                <View style={styles.actions}>
                  <Button variant="accent" disabled={!tracks.some((track) => track.available)} leftIcon={<Play size={17} color={colors.foreground} />} onPress={playAll}>Play</Button>
                  <Button variant="outline" disabled={!tracks.some((track) => track.available)} leftIcon={<Shuffle size={17} color={colors.foreground} />} onPress={shuffleAll}>Shuffle</Button>
                </View>
                <View style={styles.actions}>
                  <Button variant="outline" leftIcon={<Plus size={17} color={colors.foreground} />} onPress={() => router.push({ pathname: "/(app)/service/music/playlist/[id]/add", params: { id } } as never)}>Add songs</Button>
                  <IconButton accessibilityLabel="Rename playlist" variant="outline" icon={<Pencil size={18} color={colors.foreground} />} onPress={() => setRenaming(true)} />
                  <IconButton accessibilityLabel="Delete playlist" variant="outline" icon={<Trash2 size={18} color={colors.destructive} />} onPress={confirmDelete} />
                </View>
              </>
            )}
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
            {playlist && tracks.length > 0 && <Text style={styles.sectionTitle}>Songs in this playlist</Text>}
          </View>
        }
        ListEmptyComponent={!loading && playlist ? (
          <View style={styles.empty}>
            <ListMusic size={48} color={colors.foreground} />
            <Text style={styles.emptyTitle}>No songs yet</Text>
            <Text style={styles.emptyText}>Add songs from your local library to start this playlist.</Text>
          </View>
        ) : null}
        showsVerticalScrollIndicator={false}
      />
      <PlaylistNameDialog
        visible={renaming}
        title="Rename playlist"
        initialName={playlist?.name ?? ""}
        onSave={rename}
        onClose={() => setRenaming(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.xl },
  headerBlock: { gap: spacing.lg, marginBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  kicker: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  meta: { ...typography.muted, color: colors.muted },
  actions: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.foreground },
  error: { ...typography.muted, color: colors.destructive },
  separator: { height: spacing.lg },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  emptyTitle: { ...typography.h2, color: colors.foreground, textAlign: "center" },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center" },
});
