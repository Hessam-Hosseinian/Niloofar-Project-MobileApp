import { ArrowUpRight, Clock3, Play } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors, typography } from "@/src/theme";
import type { Game } from "../types";

type GameCardProps = {
  game: Game;
  onPress: () => void;
};

export function GameCard({ game, onPress }: GameCardProps) {
  const available = game.status === "available";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${game.title}. ${available ? "Play" : "Coming soon"}`}
      disabled={!available}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: game.color },
        !available && styles.disabled,
        pressed && available && styles.pressed,
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.emojiBadge}>
          <Text style={styles.emoji}>{game.emoji}</Text>
        </View>

        <View style={[styles.statusBadge, available ? styles.availableBadge : styles.soonBadge]}>
          {available ? (
            <Play size={12} color={colors.foreground} fill={colors.foreground} />
          ) : (
            <Clock3 size={13} color={colors.foreground} />
          )}
          <Text style={styles.statusText}>{available ? "PLAYABLE" : "SOON"}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{game.title}</Text>
        <Text style={styles.description}>{game.description}</Text>
      </View>

      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>DIFFICULTY</Text>
          <Text style={styles.metaValue}>{game.difficulty.toUpperCase()}</Text>
        </View>
        <View style={styles.playersBlock}>
          <Text style={styles.metaLabel}>MODE</Text>
          <Text style={styles.metaValue}>{game.players.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <Text style={styles.actionText}>{available ? "PLAY NOW" : "COMING SOON"}</Text>
        {available && <ArrowUpRight size={20} strokeWidth={3} color={colors.foreground} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "48%",
    minHeight: 256,
    padding: 14,
    borderWidth: 3,
    borderColor: colors.foreground,
    borderRadius: 18,
    shadowColor: colors.foreground,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  disabled: {
    opacity: 0.72,
  },
  pressed: {
    transform: [{ translateX: 3 }, { translateY: 3 }],
    shadowOffset: { width: 1, height: 1 },
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 14,
    backgroundColor: colors.white,
  },
  emoji: {
    fontSize: 26,
  },
  statusBadge: {
    minHeight: 28,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 999,
  },
  availableBadge: {
    backgroundColor: colors.white,
  },
  soonBadge: {
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  statusText: {
    ...typography.label,
    fontSize: 9.5,
    lineHeight: 13,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
  content: {
    marginTop: 18,
    flex: 1,
  },
  title: {
    ...typography.h3,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
  description: {
    ...typography.muted,
    marginTop: 5,
    color: colors.foreground,
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  playersBlock: {
    alignItems: "flex-end",
  },
  metaLabel: {
    ...typography.label,
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.foreground,
    opacity: 0.62,
  },
  metaValue: {
    marginTop: 2,
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 10.5,
    color: colors.foreground,
  },
  actionRow: {
    minHeight: 35,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: colors.foreground,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  actionText: {
    ...typography.label,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
});
