import { router } from "expo-router";
import { ArrowLeft, RotateCcw } from "lucide-react-native";
import { useCallback, useMemo, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { EmptyLibraryState } from "@/src/features/music/components/EmptyLibraryState";
import { LibraryActions } from "@/src/features/music/components/LibraryActions";
import { MusicTrackRow } from "@/src/features/music/components/MusicTrackRow";
import { addTrackToMusicPlaylist } from "@/src/features/music/data/musicPlaylistRepository";
import { removeLibraryTrack, updateMusicMetadata } from "@/src/features/music/data/musicRepository";
import { useMusicLibrary } from "@/src/features/music/hooks/useMusicLibrary";
import { useMusicPlaylists } from "@/src/features/music/hooks/useMusicPlaylists";
import { useMusicPlayerActions } from "@/src/features/music/hooks/useMusicPlayerActions";
import type { LibraryTrack } from "@/src/features/music/types";
import { browseMusic, type LibraryFilter, type LibrarySort } from "@/src/features/music/utils/libraryBrowse";
import { colors, spacing, typography } from "@/src/theme";

export default function MusicLibraryScreen() {
  const insets = useSafeAreaInsets();
  const library = useMusicLibrary();
  const playlists = useMusicPlaylists();
  const { playFromList, playNext, addToQueue, toggleFavorite, clearTrack } = useMusicPlayerActions();
  const [actionError, setActionError] = useState<string | null>(null);
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [sort, setSort] = useState<LibrarySort>("title");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<LibraryTrack | null>(null);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [saving, setSaving] = useState(false);
  const [optionsTrack, setOptionsTrack] = useState<LibraryTrack | null>(null);
  const [choosingPlaylist, setChoosingPlaylist] = useState(false);
  const visibleTracks = useMemo(
    () => browseMusic(library.tracks, library.recentTracks, filter, sort, query),
    [library.tracks, library.recentTracks, filter, sort, query],
  );
  const matchingPlaylists = useMemo(() => query.trim()
    ? playlists.playlists.filter((playlist) => playlist.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    : [], [playlists.playlists, query]);

  const startEditing = useCallback((track: LibraryTrack) => {
    setEditing(track);
    setTitle(track.title);
    setArtist(track.artist === "Unknown artist" ? "" : track.artist);
    setAlbum(track.album ?? "");
  }, []);

  const saveMetadata = useCallback(async () => {
    if (!editing || saving) return;
    setSaving(true);
    try {
      await updateMusicMetadata(editing.id, title, artist, album);
      setEditing(null);
      setActionError(null);
      await library.refresh();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not save song details.");
    } finally {
      setSaving(false);
    }
  }, [editing, saving, title, artist, album, library]);

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
    playFromList(track, visibleTracks.filter((song) => song.available));
  }, [visibleTracks, playFromList]);

  const favoriteSong = useCallback((track: LibraryTrack) => {
    void toggleFavorite(track.id)
      .then(() => setActionError(null))
      .catch((error: unknown) => {
        setActionError(error instanceof Error ? error.message : "Could not update favorites.");
      });
  }, [toggleFavorite]);

  const showOptions = useCallback((track: LibraryTrack) => {
    setOptionsTrack(track);
    setChoosingPlaylist(false);
  }, []);

  const addToPlaylist = useCallback(async (playlistId: string) => {
    if (!optionsTrack) return;
    try {
      const added = await addTrackToMusicPlaylist(playlistId, optionsTrack.id);
      setActionError(added ? null : "This song is already in that playlist.");
      setOptionsTrack(null);
      setChoosingPlaylist(false);
      await playlists.refresh();
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : "Could not add to playlist.");
    }
  }, [optionsTrack, playlists]);

  const renderItem = useCallback(({ item, index }: { item: LibraryTrack; index: number }) => {
    const group = filter === "artists" ? item.artist : filter === "albums" ? item.album : null;
    const previous = visibleTracks[index - 1];
    const previousGroup = filter === "artists" ? previous?.artist : previous?.album;
    return <View>
      {group && group !== previousGroup && <Text accessibilityRole="header" style={styles.groupTitle}>{group}</Text>}
      <MusicTrackRow track={item} onPlay={playSong} onOptions={showOptions} onFavorite={favoriteSong} />
    </View>;
  }, [favoriteSong, playSong, showOptions, filter, visibleTracks]);

  return (<>
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
          <TextInput
            accessibilityLabel="Search songs, artists, albums and playlists"
            placeholder="Search your music"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.search}
            returnKeyType="search"
          />
          {matchingPlaylists.length > 0 && <View style={styles.playlistResults}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>Playlists</Text>
            {matchingPlaylists.map((playlist) => <Pressable
              key={playlist.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: "/(app)/service/music/playlist/[id]", params: { id: playlist.id } } as never)}
              style={styles.playlistResult}
            ><Text numberOfLines={1} style={styles.filterText}>{playlist.name} · {playlist.trackCount} songs</Text></Pressable>)}
          </View>}
          {!!query.trim() && playlists.error && <Text accessibilityRole="alert" style={styles.error}>{playlists.error}</Text>}
          {library.hiddenCount > 0 && (
            <Button
              variant="outline"
              onPress={() => void library.restoreHidden()}
              leftIcon={<RotateCcw size={17} color={colors.foreground} />}
            >Restore {library.hiddenCount} excluded</Button>
          )}
          <View style={styles.filters}>
            {(["all", "favorites", "recent", "artists", "albums"] as const).map((option) => (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === option }}
                onPress={() => { setFilter(option); if (option === "recent") setSort("newest"); }}
                style={[styles.filter, filter === option && styles.activeFilter]}
              >
                <Text style={styles.filterText}>
                  {option === "all" ? "All songs" : option === "favorites" ? "Favorites" : option === "recent" ? "Recent" : option === "artists" ? "Artists" : "Albums"}
                </Text>
              </Pressable>
            ))}
          </View>
          {filter !== "artists" && filter !== "albums" && <View style={styles.filters}>
            {(["title", "artist", "newest", "mostPlayed"] as const).map((option) => <Pressable
              key={option}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === option }}
              onPress={() => setSort(option)}
              style={[styles.sortChip, sort === option && styles.activeFilter]}
            ><Text style={styles.filterText}>{option === "mostPlayed" ? "Most played" : option === "newest" ? "Newest" : option === "title" ? "Title" : "Artist"}</Text></Pressable>)}
          </View>}
          <Text style={styles.sectionTitle}>
            {filter === "all" ? "All songs" : filter === "favorites" ? "Favorites" : filter === "recent" ? "Recently played" : filter === "artists" ? "Artists" : "Albums"}
          </Text>
        </View>
      }
      ListEmptyComponent={library.loading ? null : query.trim() ? <Text style={styles.filterEmpty}>{matchingPlaylists.length ? "No matching songs." : "No matches. Try a different search."}</Text> : filter === "all" ? <EmptyLibraryState /> : (
        <Text style={styles.filterEmpty}>
          {filter === "favorites" ? "Tap the heart on a song to keep it here." : filter === "recent" ? "Songs you listen to will appear here." : "No details yet. Use a song's options to add artist and album information."}
        </Text>
      )}
      showsVerticalScrollIndicator={false}
    />
    <Modal visible={!!editing} transparent animationType="fade" onRequestClose={() => setEditing(null)}>
      <View style={styles.modalScrim}><View style={styles.modalCard}>
        <Text accessibilityRole="header" style={styles.sectionTitle}>Song details</Text>
        <TextInput accessibilityLabel="Song title" placeholder="Title" value={title} onChangeText={setTitle} style={styles.search} />
        <TextInput accessibilityLabel="Artist" placeholder="Artist" value={artist} onChangeText={setArtist} style={styles.search} />
        <TextInput accessibilityLabel="Album" placeholder="Album" value={album} onChangeText={setAlbum} style={styles.search} />
        {actionError && <Text accessibilityRole="alert" style={styles.error}>{actionError}</Text>}
        <View style={styles.modalActions}>
          <Button variant="outline" onPress={() => setEditing(null)}>Cancel</Button>
          <Button variant="accent" disabled={saving || !title.trim()} onPress={() => void saveMetadata()}>Save</Button>
        </View>
      </View></View>
    </Modal>
    <Modal visible={!!optionsTrack} transparent animationType="fade" onRequestClose={() => setOptionsTrack(null)}>
      <View style={styles.modalScrim}><View style={styles.modalCard}>
        <Text accessibilityRole="header" numberOfLines={2} style={styles.sectionTitle}>
          {choosingPlaylist ? "Add to playlist" : optionsTrack?.title}
        </Text>
        {choosingPlaylist ? playlists.playlists.length ? <ScrollView style={styles.playlistChoices}>{playlists.playlists.map((playlist) => <Button
          key={playlist.id} variant="outline" onPress={() => void addToPlaylist(playlist.id)}
        >{playlist.name}</Button>)}</ScrollView> : <Text style={styles.filterEmpty}>Create a playlist first from the Music home.</Text> : <>
          {optionsTrack?.available && <>
            <Button variant="outline" onPress={() => { playNext(optionsTrack); setOptionsTrack(null); }}>Play next</Button>
            <Button variant="outline" onPress={() => { addToQueue(optionsTrack); setOptionsTrack(null); }}>Add to queue</Button>
          </>}
          <Button variant="outline" onPress={() => { if (optionsTrack) startEditing(optionsTrack); setOptionsTrack(null); }}>Edit details</Button>
          {playlists.playlists.length > 0 && <Button variant="outline" onPress={() => setChoosingPlaylist(true)}>Add to playlist</Button>}
          <Button variant="outline" onPress={() => { if (optionsTrack) remove(optionsTrack); setOptionsTrack(null); }}>
            {optionsTrack?.sourceType === "device" ? "Exclude from library" : "Remove import"}
          </Button>
        </>}
        <Button variant="outline" onPress={() => { setOptionsTrack(null); setChoosingPlaylist(false); }}>Close</Button>
      </View></View>
    </Modal>
  </>);
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
  error: { ...typography.muted, color: colors.destructive },
  groupTitle: { ...typography.h4, color: colors.foreground, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  search: { minHeight: 48, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white, color: colors.foreground, paddingHorizontal: spacing.md, ...typography.body },
  sortChip: { minHeight: 36, justifyContent: "center", paddingHorizontal: spacing.sm, borderWidth: 1, borderColor: colors.foreground, backgroundColor: colors.white },
  playlistResults: { gap: spacing.sm },
  playlistResult: { minHeight: 44, justifyContent: "center", paddingHorizontal: spacing.md, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground },
  modalScrim: { flex: 1, justifyContent: "center", padding: spacing.xl, backgroundColor: "rgba(0,0,0,0.55)" },
  modalCard: { gap: spacing.md, padding: spacing.xl, backgroundColor: colors.background, borderWidth: 2, borderColor: colors.foreground },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
  playlistChoices: { maxHeight: 360 },
});
