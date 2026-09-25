import { StyleSheet, Text, View } from "react-native";

import { MusicTrackRow } from "@/src/features/music/components/MusicTrackRow";
import type { LibraryTrack } from "@/src/features/music/types";
import { colors, spacing, typography } from "@/src/theme";

type Props = {
  title: string;
  tracks: LibraryTrack[];
  onPlay: (track: LibraryTrack) => void;
  onFavorite: (track: LibraryTrack) => void;
};

export function MusicCollectionPreview({ title, tracks, onPlay, onFavorite }: Props) {
  if (tracks.length === 0) return null;
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>{title}</Text>
      <View style={styles.list}>
        {tracks.slice(0, 3).map((track) => (
          <MusicTrackRow
            key={track.id}
            track={track}
            onPlay={onPlay}
            onFavorite={onFavorite}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.lg },
  title: { ...typography.h3, color: colors.foreground },
  list: { gap: spacing.sm },
});
