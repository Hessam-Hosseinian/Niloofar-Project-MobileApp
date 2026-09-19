import { ArrowLeft, Clock3 } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { TicTacToeGame } from "@/src/features/games/components/TicTacToeGame";
import { getGameByKey } from "@/src/features/games/data/gameCatalog";
import { colors, typography } from "@/src/theme";

export default function GameScreen() {
  const params = useLocalSearchParams<{ gameKey?: string | string[] }>();
  const gameKey = Array.isArray(params.gameKey) ? params.gameKey[0] : params.gameKey;
  const game = gameKey ? getGameByKey(gameKey) : undefined;

  if (!game) {
    return (
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundEmoji}>🎲</Text>
          <Text style={styles.notFoundTitle}>Game not found</Text>
          <Text style={styles.notFoundText}>This game is not in the catalog yet.</Text>
          <Pressable onPress={() => router.back()} style={styles.primaryButton}>
            <ArrowLeft size={18} strokeWidth={3} color={colors.foreground} />
            <Text style={styles.primaryButtonText}>BACK TO GAMES</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressedButton]}
          >
            <ArrowLeft size={22} strokeWidth={3} color={colors.foreground} />
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>MINI GAME</Text>
            <Text style={styles.title}>{game.title}</Text>
          </View>

          <View style={[styles.emojiBadge, { backgroundColor: game.color }]}>
            <Text style={styles.emoji}>{game.emoji}</Text>
          </View>
        </View>

        {game.key === "tic-tac-toe" && game.status === "available" ? (
          <TicTacToeGame />
        ) : (
          <View style={[styles.comingSoonCard, { backgroundColor: game.color }]}>
            <View style={styles.clockBadge}>
              <Clock3 size={28} strokeWidth={2.7} color={colors.foreground} />
            </View>
            <Text style={styles.comingSoonTitle}>Coming soon.</Text>
            <Text style={styles.comingSoonText}>{game.description}</Text>
            <View style={styles.metaPill}>
              <Text style={styles.metaPillText}>{game.difficulty.toUpperCase()} • {game.players.toUpperCase()}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 38,
  },
  header: {
    marginBottom: 22,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 13,
    backgroundColor: colors.white,
    shadowColor: colors.foreground,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  pressedButton: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
    shadowOffset: { width: 0, height: 0 },
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  eyebrow: {
    ...typography.label,
    fontSize: 9.5,
    color: colors.muted,
  },
  title: {
    ...typography.h2,
    color: colors.foreground,
  },
  emojiBadge: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 14,
  },
  emoji: {
    fontSize: 25,
  },
  comingSoonCard: {
    padding: 22,
    borderWidth: 3,
    borderColor: colors.foreground,
    borderRadius: 20,
    shadowColor: colors.foreground,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  clockBadge: {
    width: 54,
    height: 54,
    marginBottom: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 15,
    backgroundColor: colors.white,
  },
  comingSoonTitle: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 30,
    lineHeight: 36,
    color: colors.foreground,
  },
  comingSoonText: {
    ...typography.body,
    marginTop: 8,
    color: colors.foreground,
  },
  metaPill: {
    alignSelf: "flex-start",
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 999,
    backgroundColor: colors.white,
  },
  metaPillText: {
    ...typography.label,
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 10,
    lineHeight: 14,
    color: colors.foreground,
  },
  notFound: {
    flex: 1,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundEmoji: {
    fontSize: 48,
  },
  notFoundTitle: {
    ...typography.h1,
    marginTop: 14,
    color: colors.foreground,
  },
  notFoundText: {
    ...typography.body,
    marginTop: 4,
    textAlign: "center",
    color: colors.muted,
  },
  primaryButton: {
    minHeight: 50,
    marginTop: 22,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 13,
    backgroundColor: colors.yellow,
  },
  primaryButtonText: {
    ...typography.button,
    fontFamily: "SpaceGrotesk_500Medium",
    color: colors.foreground,
  },
});
