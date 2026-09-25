import { router } from "expo-router";
import { ArrowLeft, ListMusic } from "lucide-react-native";
import { useCallback } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { MusicQueueItem } from "@/src/features/music/components/MusicQueueItem";
import { useMusicQueue } from "@/src/features/music/hooks/useMusicQueue";
import type { QueueEntry } from "@/src/features/music/utils/playbackQueue";
import { colors, spacing, typography } from "@/src/theme";

export default function MusicQueueScreen() {
  const insets = useSafeAreaInsets();
  const { queue, shuffleEnabled, jumpToQueueEntry, removeFromQueue, clearUpcoming, moveInQueue } = useMusicQueue();
  const visible = queue.entries.slice(Math.max(queue.currentIndex, 0));
  const upcomingCount = Math.max(queue.entries.length - queue.currentIndex - 1, 0);

  const confirmClear = useCallback(() => {
    Alert.alert("Clear upcoming songs?", "The song playing now will continue.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: clearUpcoming },
    ]);
  }, [clearUpcoming]);

  const renderItem = useCallback(({ item, index }: { item: QueueEntry; index: number }) => (
    <MusicQueueItem
      entry={item}
      current={index === 0}
      canMoveUp={!shuffleEnabled && index > 1}
      canMoveDown={!shuffleEnabled && index > 0 && index < visible.length - 1}
      onPlay={jumpToQueueEntry}
      onMove={moveInQueue}
      onRemove={removeFromQueue}
    />
  ), [jumpToQueueEntry, moveInQueue, removeFromQueue, visible.length, shuffleEnabled]);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.xl) + spacing.xl }]}
      data={visible}
      keyExtractor={(entry) => String(entry.id)}
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
              <Text style={styles.kicker}>NILOOFAR MUSIC</Text>
              <Text accessibilityRole="header" style={styles.title}>Queue</Text>
            </View>
          </View>
          <View style={styles.summary}>
            <Text style={styles.count}>{upcomingCount} UP NEXT</Text>
            {upcomingCount > 0 && (
              <Button variant="outline" size="small" onPress={confirmClear}>Clear upcoming</Button>
            )}
          </View>
          {shuffleEnabled && <Text style={styles.hint}>Turn off Shuffle in Now Playing to reorder upcoming songs.</Text>}
        </View>
      }
      ListEmptyComponent={
        <View style={styles.empty}>
          <ListMusic size={48} color={colors.foreground} />
          <Text style={styles.emptyTitle}>Your queue is empty</Text>
          <Text style={styles.emptyText}>Play a song or add one from your library.</Text>
          <Button variant="accent" onPress={() => router.push("/(app)/service/music/library" as never)}>
            Open library
          </Button>
        </View>
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingTop: spacing.xl },
  headerBlock: { gap: spacing.xl, marginBottom: spacing.lg },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  headingCopy: { flex: 1 },
  kicker: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  summary: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  count: { ...typography.label, color: colors.muted },
  hint: { ...typography.muted, color: colors.muted },
  separator: { height: spacing.sm },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: spacing.lg },
  emptyTitle: { ...typography.h2, color: colors.foreground, textAlign: "center" },
  emptyText: { ...typography.body, color: colors.muted, textAlign: "center" },
});
