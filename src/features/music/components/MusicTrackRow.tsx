import { Ellipsis, Heart, Play } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MusicArtwork } from "@/src/features/music/components/MusicArtwork";
import type { LibraryTrack } from "@/src/features/music/types";
import { formatPlaybackTime } from "@/src/features/music/utils/duration";
import { colors, spacing, typography } from "@/src/theme";

type Props = {
  track: LibraryTrack;
  onPlay: (track: LibraryTrack) => void;
  onOptions?: (track: LibraryTrack) => void;
  onFavorite?: (track: LibraryTrack) => void;
};

export const MusicTrackRow = memo(function MusicTrackRow({ track, onPlay, onOptions, onFavorite }: Props) {
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Play ${track.title}`}
        accessibilityState={{ disabled: !track.available }}
        disabled={!track.available}
        onPress={() => onPlay(track)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <MusicArtwork seed={`${track.title}:${track.artist}`} size={52} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
          <Text numberOfLines={1} style={styles.subtitle}>
            {track.available ? track.artist : "File unavailable"}
            {track.available && track.durationSeconds ? ` · ${formatPlaybackTime(track.durationSeconds)}` : ""}
            {track.playCount > 0 ? ` · ${track.playCount} play${track.playCount === 1 ? "" : "s"}` : ""}
          </Text>
        </View>
        <Play size={18} color={track.available ? colors.foreground : colors.muted} />
      </Pressable>
      {onFavorite && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${track.favorite ? "Remove" : "Add"} ${track.title} ${track.favorite ? "from" : "to"} favorites`}
          onPress={() => onFavorite(track)}
          style={styles.options}
        >
          <Heart
            size={21}
            color={colors.foreground}
            fill={track.favorite ? colors.pink : "transparent"}
          />
        </Pressable>
      )}
      {onOptions && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Options for ${track.title}`}
          onPress={() => onOptions(track)}
          style={styles.options}
        >
          <Ellipsis size={23} color={colors.foreground} />
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },
  main: {
    minHeight: 70,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingLeft: spacing.sm,
    paddingRight: spacing.md,
  },
  pressed: { opacity: 0.72 },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.h4, color: colors.foreground },
  subtitle: { ...typography.muted, color: colors.muted },
  options: { width: 46, minHeight: 56, alignItems: "center", justifyContent: "center" },
});
