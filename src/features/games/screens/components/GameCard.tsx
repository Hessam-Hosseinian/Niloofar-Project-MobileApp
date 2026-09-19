import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Game } from "../types";

type GameCardProps = {
  game: Game;
  onPress: () => void;
};

export function GameCard({ game, onPress }: GameCardProps) {
  const available = game.status === "available";

  return (
    <Pressable
      onPress={onPress}
      disabled={!available}
      style={[styles.card, !available && styles.disabled]}
    >
      <Text style={styles.emoji}>{game.emoji}</Text>

      <Text style={styles.title}>{game.title}</Text>

      <Text style={styles.description}>{game.description}</Text>

      <View style={styles.footer}>
        <Text style={styles.difficulty}>{game.difficulty?.toUpperCase()}</Text>

        <Text style={styles.action}>
          {available ? "PLAY →" : "COMING SOON"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 190,
    padding: 16,

    backgroundColor: "#FFFFFF",

    borderWidth: 3,
    borderColor: "#111111",
    borderRadius: 16,

    justifyContent: "space-between",
  },

  disabled: {
    opacity: 0.55,
  },

  emoji: {
    fontSize: 38,
  },

  title: {
    fontSize: 20,
    fontWeight: "900",
  },

  description: {
    fontSize: 13,
    lineHeight: 18,
  },

  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  difficulty: {
    fontSize: 11,
    fontWeight: "800",
  },

  action: {
    fontSize: 12,
    fontWeight: "900",
  },
});
