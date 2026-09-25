import { Check, Plus } from "lucide-react-native";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { MusicArtwork } from "@/src/features/music/components/MusicArtwork";
import type { LibraryTrack } from "@/src/features/music/types";
import { colors, radius, spacing, typography } from "@/src/theme";

type Props = {
  track: LibraryTrack;
  added: boolean;
  busy: boolean;
  onAdd: (track: LibraryTrack) => void;
};

export const PlaylistAddTrackRow = memo(function PlaylistAddTrackRow({ track, added, busy, onAdd }: Props) {
  return (
    <View style={styles.row}>
      <MusicArtwork seed={`${track.title}:${track.artist}`} size={44} />
      <View style={styles.copy}>
        <Text numberOfLines={1} style={styles.title}>{track.title}</Text>
        <Text numberOfLines={1} style={styles.artist}>{track.artist}</Text>
      </View>
      <Button
        variant={added ? "outline" : "accent"}
        size="small"
        disabled={added || busy}
        loading={busy}
        accessibilityLabel={added ? `${track.title} already added` : `Add ${track.title} to playlist`}
        leftIcon={added
          ? <Check size={16} color={colors.foreground} />
          : <Plus size={16} color={colors.foreground} />}
        onPress={() => onAdd(track)}
      >{added ? "Added" : "Add"}</Button>
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.h4, color: colors.foreground },
  artist: { ...typography.muted, color: colors.muted },
});
