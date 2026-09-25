import { router } from "expo-router";
import { ArrowLeft, ArrowRight } from "lucide-react-native";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconButton } from "@/src/components/ui/IconButton";
import { EmptyLibraryState } from "@/src/features/music/components/EmptyLibraryState";
import { LibraryActions } from "@/src/features/music/components/LibraryActions";
import { MusicHero } from "@/src/features/music/components/MusicHero";
import { MusicTrackRow } from "@/src/features/music/components/MusicTrackRow";
import { useMusicLibrary } from "@/src/features/music/hooks/useMusicLibrary";
import { useMusicPlayerActions } from "@/src/features/music/hooks/useMusicPlayerActions";
import type { LibraryTrack } from "@/src/features/music/types";
import { colors, spacing, typography } from "@/src/theme";

export default function MusicScreen() {
  const insets = useSafeAreaInsets();
  const library = useMusicLibrary(true);
  const { playFromList } = useMusicPlayerActions();
  const playSong = (track: LibraryTrack) =>
    playFromList(track, library.tracks.filter((song) => song.available));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.lg },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          variant="outline"
          icon={
            <ArrowLeft size={20} strokeWidth={2.4} color={colors.foreground} />
          }
          onPress={() => router.back()}
        />

        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>NILOOFAR</Text>
          <Text accessibilityRole="header" style={styles.headerTitle}>
            Music
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Your library
          </Text>
          <Text style={styles.sectionMeta}>{library.tracks.length} SONGS</Text>
        </View>
        <LibraryActions
          busy={library.busy}
          message={library.message}
          error={library.error}
          onScan={() => void library.scan()}
          onImport={() => void library.importFiles()}
        />
      </View>

      <MusicHero />

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <Text accessibilityRole="header" style={styles.sectionTitle}>
            Songs
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push("/(app)/service/music/library" as never)}
            style={styles.seeAll}
          >
            <Text style={styles.seeAllText}>See all</Text>
            <ArrowRight size={17} color={colors.foreground} />
          </Pressable>
        </View>
        {library.loading ? <ActivityIndicator color={colors.foreground} /> :
          library.tracks.length === 0 ? <EmptyLibraryState /> : (
            <View style={styles.preview}>
              {library.tracks.slice(0, 3).map((track) => (
                <MusicTrackRow key={track.id} track={track} onPlay={playSong} />
              ))}
            </View>
          )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.xl,
    gap: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  headerCopy: {
    flex: 1,
  },
  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },
  headerTitle: {
    ...typography.h1,
    color: colors.foreground,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },
  sectionMeta: {
    ...typography.label,
    color: colors.muted,
  },
  seeAll: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  seeAllText: { ...typography.muted, color: colors.foreground },
  preview: { gap: spacing.sm },
});
