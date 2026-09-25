import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { PlaylistAddTrackRow } from "@/src/features/music/components/PlaylistAddTrackRow";
import {
  addTrackToMusicPlaylist,
  getMusicPlaylistTracks,
} from "@/src/features/music/data/musicPlaylistRepository";
import { useMusicLibrary } from "@/src/features/music/hooks/useMusicLibrary";
import type { LibraryTrack } from "@/src/features/music/types";
import { colors, spacing, typography } from "@/src/theme";

export default function MusicPlaylistAddScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const library = useMusicLibrary();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tracks = library.tracks.filter((track) => track.available);

  useFocusEffect(useCallback(() => {
    void getMusicPlaylistTracks(id)
      .then((items) => setAddedIds(new Set(items.map((item) => item.id))))
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not load playlist songs."));
  }, [id]));

  const add = (track: LibraryTrack) => {
    if (busyId) return;
    setBusyId(track.id);
    void addTrackToMusicPlaylist(id, track.id)
      .then((inserted) => {
        if (!inserted && !addedIds.has(track.id)) throw new Error("Could not add this song.");
        setAddedIds((current) => new Set(current).add(track.id));
        setError(null);
      })
      .catch((caught: unknown) => setError(caught instanceof Error ? caught.message : "Could not add this song."))
      .finally(() => setBusyId(null));
  };

  const renderItem = ({ item }: { item: LibraryTrack }) => (
    <PlaylistAddTrackRow
      track={item}
      added={addedIds.has(item.id)}
      busy={busyId === item.id}
      onAdd={add}
    />
  );

  return (
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
            <View style={styles.headingCopy}>
              <Text style={styles.kicker}>YOUR PLAYLIST</Text>
              <Text accessibilityRole="header" style={styles.title}>Add songs</Text>
            </View>
          </View>
          <Text style={styles.hint}>Choose from songs already in your Niloofar library.</Text>
          <Button variant="accent" onPress={() => router.back()}>Done</Button>
          {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={library.loading ? <ActivityIndicator color={colors.foreground} /> : (
        <Text style={styles.hint}>No playable songs yet. Scan your phone or import music first.</Text>
      )}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.xl },
  headerBlock: { gap: spacing.lg, marginBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headingCopy: { flex: 1 },
  kicker: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  hint: { ...typography.body, color: colors.muted },
  error: { ...typography.muted, color: colors.destructive },
  separator: { height: spacing.sm },
});
