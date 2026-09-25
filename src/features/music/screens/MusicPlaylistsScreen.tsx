import { router } from "expo-router";
import { ArrowLeft, ListMusic, Plus } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { PlaylistNameDialog } from "@/src/features/music/components/PlaylistNameDialog";
import {
  createMusicPlaylist,
  type MusicPlaylist,
} from "@/src/features/music/data/musicPlaylistRepository";
import { useMusicPlaylists } from "@/src/features/music/hooks/useMusicPlaylists";
import { colors, radius, spacing, typography } from "@/src/theme";

export default function MusicPlaylistsScreen() {
  const insets = useSafeAreaInsets();
  const { playlists, loading, error, refresh } = useMusicPlaylists();
  const [creating, setCreating] = useState(false);

  const create = async (name: string) => {
    const id = await createMusicPlaylist(name);
    setCreating(false);
    await refresh();
    router.push({ pathname: "/(app)/service/music/playlist/[id]", params: { id } } as never);
  };

  const renderItem = ({ item }: { item: MusicPlaylist }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.name} playlist, ${item.trackCount} songs`}
      onPress={() => router.push({ pathname: "/(app)/service/music/playlist/[id]", params: { id: item.id } } as never)}
      style={styles.card}
    >
      <View style={styles.icon}><ListMusic size={28} color={colors.foreground} /></View>
      <View style={styles.cardCopy}>
        <Text numberOfLines={1} style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardMeta}>{item.trackCount} song{item.trackCount === 1 ? "" : "s"}</Text>
      </View>
    </Pressable>
  );

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xl }]}
        data={playlists}
        keyExtractor={(playlist) => playlist.id}
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
              <View style={styles.headerCopy}>
                <Text style={styles.kicker}>YOUR COLLECTION</Text>
                <Text accessibilityRole="header" style={styles.title}>Playlists</Text>
              </View>
            </View>
            <Button
              variant="accent"
              leftIcon={<Plus size={18} color={colors.foreground} />}
              onPress={() => setCreating(true)}
            >New playlist</Button>
            {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          </View>
        }
        ListEmptyComponent={loading ? <ActivityIndicator color={colors.foreground} /> : (
          <View style={styles.empty}>
            <ListMusic size={48} color={colors.foreground} />
            <Text style={styles.emptyTitle}>Make your first mix</Text>
            <Text style={styles.emptyText}>Group songs from your phone or imports in a playlist of your own.</Text>
          </View>
        )}
        showsVerticalScrollIndicator={false}
      />
      <PlaylistNameDialog
        visible={creating}
        title="New playlist"
        onSave={create}
        onClose={() => setCreating(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.xl },
  headerBlock: { gap: spacing.xl, marginBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headerCopy: { flex: 1 },
  kicker: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  error: { ...typography.muted, color: colors.destructive },
  card: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  icon: { width: 54, height: 54, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple, borderWidth: 2, borderColor: colors.foreground },
  cardCopy: { flex: 1, minWidth: 0 },
  cardTitle: { ...typography.h3, color: colors.foreground },
  cardMeta: { ...typography.muted, color: colors.muted },
  separator: { height: spacing.sm },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  emptyTitle: { ...typography.h2, color: colors.foreground, textAlign: "center" },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center" },
});
