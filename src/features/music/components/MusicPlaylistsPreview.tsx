import { router } from "expo-router";
import { ArrowRight, ListMusic } from "lucide-react-native";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import type { MusicPlaylist } from "@/src/features/music/data/musicPlaylistRepository";
import { colors, radius, spacing, typography } from "@/src/theme";

type Props = { playlists: MusicPlaylist[]; loading: boolean; error: string | null };

export function MusicPlaylistsPreview({ playlists, loading, error }: Props) {
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>Playlists</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See all playlists"
          onPress={() => router.push("/(app)/service/music/playlists" as never)}
          style={styles.seeAll}
        >
          <Text style={styles.seeAllText}>See all</Text>
          <ArrowRight size={17} color={colors.foreground} />
        </Pressable>
      </View>
      {loading ? <ActivityIndicator color={colors.foreground} /> : error ? (
        <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
      ) : playlists.length === 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create your first playlist"
          onPress={() => router.push("/(app)/service/music/playlists" as never)}
          style={styles.empty}
        >
          <ListMusic size={26} color={colors.foreground} />
          <Text style={styles.emptyText}>Make your first mix from songs in your library.</Text>
          <ArrowRight size={18} color={colors.foreground} />
        </Pressable>
      ) : (
        <View style={styles.list}>
          {playlists.slice(0, 2).map((playlist) => (
            <Pressable
              key={playlist.id}
              accessibilityRole="button"
              accessibilityLabel={`Open ${playlist.name} playlist`}
              onPress={() => router.push({ pathname: "/(app)/service/music/playlist/[id]", params: { id: playlist.id } } as never)}
              style={styles.card}
            >
              <View style={styles.icon}><ListMusic size={21} color={colors.foreground} /></View>
              <View style={styles.copy}>
                <Text numberOfLines={1} style={styles.cardTitle}>{playlist.name}</Text>
                <Text style={styles.meta}>{playlist.trackCount} songs</Text>
              </View>
              <ArrowRight size={18} color={colors.foreground} />
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  heading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { ...typography.h3, color: colors.foreground },
  seeAll: { minHeight: 44, flexDirection: "row", alignItems: "center", gap: spacing.xs },
  seeAllText: { ...typography.muted, color: colors.foreground },
  empty: {
    minHeight: 86, flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.lg, backgroundColor: colors.yellow,
    borderWidth: 2, borderColor: colors.foreground, borderRadius: radius.sm,
  },
  emptyText: { ...typography.body, color: colors.foreground, flex: 1 },
  list: { gap: spacing.sm },
  card: {
    minHeight: 72, flexDirection: "row", alignItems: "center", gap: spacing.md,
    padding: spacing.sm, backgroundColor: colors.white,
    borderWidth: 2, borderColor: colors.foreground, borderRadius: radius.sm,
  },
  icon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", backgroundColor: colors.purple, borderWidth: 2, borderColor: colors.foreground },
  copy: { flex: 1, minWidth: 0 },
  cardTitle: { ...typography.h4, color: colors.foreground },
  meta: { ...typography.muted, color: colors.muted },
  error: { ...typography.muted, color: colors.destructive },
});
