import { ArrowDown, ArrowUp, Trash2 } from "lucide-react-native";
import { memo } from "react";
import { StyleSheet, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { MusicTrackRow } from "@/src/features/music/components/MusicTrackRow";
import type { LibraryTrack } from "@/src/features/music/types";
import { colors, spacing } from "@/src/theme";

type Props = {
  track: LibraryTrack;
  index: number;
  count: number;
  onPlay: (track: LibraryTrack) => void;
  onFavorite: (track: LibraryTrack) => void;
  onMove: (track: LibraryTrack, direction: -1 | 1) => void;
  onRemove: (track: LibraryTrack) => void;
};

export const PlaylistTrackItem = memo(function PlaylistTrackItem({
  track, index, count, onPlay, onFavorite, onMove, onRemove,
}: Props) {
  return (
    <View style={styles.container}>
      <MusicTrackRow track={track} onPlay={onPlay} onFavorite={onFavorite} />
      <View style={styles.actions}>
        <Button
          variant="outline"
          size="small"
          disabled={index === 0}
          accessibilityLabel={`Move ${track.title} up`}
          leftIcon={<ArrowUp size={16} color={colors.foreground} />}
          onPress={() => onMove(track, -1)}
        >Up</Button>
        <Button
          variant="outline"
          size="small"
          disabled={index === count - 1}
          accessibilityLabel={`Move ${track.title} down`}
          leftIcon={<ArrowDown size={16} color={colors.foreground} />}
          onPress={() => onMove(track, 1)}
        >Down</Button>
        <Button
          variant="ghost"
          size="small"
          accessibilityLabel={`Remove ${track.title} from playlist`}
          leftIcon={<Trash2 size={16} color={colors.destructive} />}
          onPress={() => onRemove(track)}
        >Remove</Button>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
