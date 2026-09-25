import { ArrowDown, ArrowUp, X } from "lucide-react-native";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MusicArtwork } from "@/src/features/music/components/MusicArtwork";
import type { QueueEntry } from "@/src/features/music/utils/playbackQueue";
import { colors, radius, spacing, typography } from "@/src/theme";

type Props = {
  entry: QueueEntry;
  current: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onPlay: (id: number) => void;
  onMove: (id: number, direction: -1 | 1) => void;
  onRemove: (id: number) => void;
};

export const MusicQueueItem = memo(function MusicQueueItem({
  entry, current, canMoveUp, canMoveDown, onPlay, onMove, onRemove,
}: Props) {
  return (
    <View style={[styles.row, current && styles.current]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${current ? "Now playing" : "Play queued"} ${entry.track.title}`}
        accessibilityState={{ disabled: current }}
        disabled={current}
        onPress={() => onPlay(entry.id)}
        style={styles.track}
      >
        <MusicArtwork seed={`${entry.track.title}:${entry.track.artist}`} size={44} />
        <View style={styles.copy}>
          <Text numberOfLines={1} style={styles.title}>{entry.track.title}</Text>
          <Text numberOfLines={1} style={styles.artist}>{entry.track.artist}</Text>
        </View>
      </Pressable>
      {current ? (
        <Text style={styles.nowLabel}>NOW</Text>
      ) : (
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${entry.track.title} up`}
            accessibilityState={{ disabled: !canMoveUp }}
            disabled={!canMoveUp}
            onPress={() => onMove(entry.id, -1)}
            style={styles.action}
          >
            <ArrowUp size={18} color={canMoveUp ? colors.foreground : colors.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Move ${entry.track.title} down`}
            accessibilityState={{ disabled: !canMoveDown }}
            disabled={!canMoveDown}
            onPress={() => onMove(entry.id, 1)}
            style={styles.action}
          >
            <ArrowDown size={18} color={canMoveDown ? colors.foreground : colors.muted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Remove ${entry.track.title} from queue`}
            onPress={() => onRemove(entry.id)}
            style={styles.action}
          >
            <X size={19} color={colors.foreground} />
          </Pressable>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    minHeight: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  current: { backgroundColor: colors.yellow },
  track: {
    minHeight: 64,
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingLeft: spacing.sm,
  },
  copy: { flex: 1, minWidth: 0 },
  title: { ...typography.h4, color: colors.foreground },
  artist: { ...typography.muted, color: colors.muted },
  nowLabel: { ...typography.label, color: colors.foreground, paddingHorizontal: spacing.md },
  actions: { flexDirection: "row", paddingRight: spacing.xs },
  action: { width: 40, minHeight: 48, alignItems: "center", justifyContent: "center" },
});
