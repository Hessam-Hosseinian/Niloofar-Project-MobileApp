import { ArrowLeft, Gamepad2, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { GameCard } from "@/src/features/games/components/GameCard";
import { games } from "@/src/features/games/data/gameCatalog";
import { colors, typography } from "@/src/theme";

export default function GamesScreen() {
  const availableCount = games.filter((game) => game.status === "available").length;
  const plannedCount = games.length - availableCount;

  function openGame(gameKey: string) {
    router.push({
      pathname: "/(app)/service/games/[gameKey]",
      params: { gameKey },
    });
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressedButton]}
          >
            <ArrowLeft size={22} strokeWidth={3} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerEyebrow}>PLAYGROUND</Text>
            <Text style={styles.headerTitle}>Mini Games</Text>
          </View>

          <View style={styles.headerIcon}>
            <Gamepad2 size={23} strokeWidth={2.8} color={colors.foreground} />
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Sparkles size={26} strokeWidth={2.6} color={colors.foreground} />
          </View>
          <Text style={styles.heroTitle}>Tiny games.{"\n"}Big distractions.</Text>
          <Text style={styles.heroText}>
            Quick games for short breaks. New ones can drop in here without changing the hub.
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{games.length}</Text>
              <Text style={styles.statLabel}>TOTAL</Text>
            </View>
            <View style={[styles.stat, styles.availableStat]}>
              <Text style={styles.statValue}>{availableCount}</Text>
              <Text style={styles.statLabel}>PLAYABLE</Text>
            </View>
            <View style={[styles.stat, styles.plannedStat]}>
              <Text style={styles.statValue}>{plannedCount}</Text>
              <Text style={styles.statLabel}>COMING</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>ARCADE SHELF</Text>
            <Text style={styles.sectionTitle}>Pick a game</Text>
          </View>
          <Text style={styles.sectionHint}>{availableCount ? "Tap a playable card" : "Games are on the way"}</Text>
        </View>

        <View style={styles.grid}>
          {games.map((game) => (
            <GameCard
              game={game}
              key={game.key}
              onPress={() => openGame(game.key)}
            />
          ))}
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerEmoji}>🕹️</Text>
          <View style={styles.footerCopy}>
            <Text style={styles.footerTitle}>More games later.</Text>
            <Text style={styles.footerText}>
              Each game stays isolated so the collection can grow without turning this screen into a giant file.
            </Text>
          </View>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
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
  headerTitleWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerEyebrow: {
    ...typography.label,
    fontSize: 10,
    color: colors.muted,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.foreground,
  },
  headerIcon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 13,
    backgroundColor: colors.purple,
  },
  hero: {
    padding: 20,
    borderWidth: 3,
    borderColor: colors.foreground,
    borderRadius: 22,
    backgroundColor: colors.blue,
    shadowColor: colors.foreground,
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  heroIcon: {
    width: 46,
    height: 46,
    marginBottom: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 14,
    backgroundColor: colors.yellow,
  },
  heroTitle: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 30,
    lineHeight: 34,
    color: colors.foreground,
  },
  heroText: {
    ...typography.body,
    maxWidth: 440,
    marginTop: 10,
    color: colors.foreground,
  },
  statsRow: {
    marginTop: 20,
    flexDirection: "row",
    gap: 9,
  },
  stat: {
    flex: 1,
    minHeight: 70,
    paddingHorizontal: 10,
    paddingVertical: 9,
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 13,
    backgroundColor: colors.white,
  },
  availableStat: {
    backgroundColor: colors.green,
  },
  plannedStat: {
    backgroundColor: colors.yellow,
  },
  statValue: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 22,
    lineHeight: 25,
    color: colors.foreground,
  },
  statLabel: {
    ...typography.label,
    marginTop: 1,
    fontSize: 8.5,
    lineHeight: 12,
    color: colors.foreground,
  },
  sectionHeader: {
    marginTop: 32,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionEyebrow: {
    ...typography.label,
    fontSize: 9.5,
    color: colors.muted,
  },
  sectionTitle: {
    ...typography.h2,
    color: colors.foreground,
  },
  sectionHint: {
    ...typography.muted,
    maxWidth: 130,
    textAlign: "right",
    color: colors.muted,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  footerNote: {
    marginTop: 26,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 2.5,
    borderColor: colors.foreground,
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  footerEmoji: {
    fontSize: 28,
  },
  footerCopy: {
    flex: 1,
  },
  footerTitle: {
    ...typography.h4,
    color: colors.foreground,
  },
  footerText: {
    ...typography.muted,
    marginTop: 2,
    color: colors.muted,
  },
});
