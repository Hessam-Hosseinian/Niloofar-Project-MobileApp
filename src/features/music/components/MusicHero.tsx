import { Headphones, Music2, Sparkles } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/src/components/ui/Surface";
import { colors, radius, spacing, typography } from "@/src/theme";

export function MusicHero() {
  return (
    <Surface
      backgroundColor={colors.pink}
      shadow="lg"
      contentStyle={styles.surface}
    >
      <View style={styles.copy}>
        <View style={styles.kicker}>
          <Sparkles size={15} strokeWidth={2.4} color={colors.foreground} />
          <Text style={styles.kickerText}>YOUR SOUND, YOUR SPACE</Text>
        </View>

        <Text accessibilityRole="header" style={styles.title}>
          Music that feels at home.
        </Text>

        <Text style={styles.description}>
          A private place for the songs you own, shaped in Niloofar&apos;s bold
          style.
        </Text>
      </View>

      <View accessibilityElementsHidden style={styles.artwork}>
        <View style={styles.artworkShadow} />
        <View style={styles.artworkTile}>
          <View style={styles.sun} />
          <View style={styles.waveBack} />
          <View style={styles.waveFront} />

          <View style={styles.headphonesBadge}>
            <Headphones
              size={36}
              strokeWidth={2.2}
              color={colors.foreground}
            />
          </View>

          <View style={styles.noteBadge}>
            <Music2
              size={20}
              strokeWidth={2.6}
              color={colors.foreground}
            />
          </View>
        </View>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    minHeight: 400,
    padding: spacing.xl,
    gap: spacing.xl,
  },
  copy: {
    gap: spacing.md,
  },
  kicker: {
    alignSelf: "flex-start",
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
  },
  kickerText: {
    ...typography.label,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: colors.foreground,
  },
  title: {
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 34,
    lineHeight: 39,
    color: colors.foreground,
    maxWidth: 290,
  },
  description: {
    ...typography.body,
    color: colors.foreground,
    maxWidth: 310,
  },
  artwork: {
    minHeight: 164,
    position: "relative",
  },
  artworkShadow: {
    position: "absolute",
    top: 6,
    left: 6,
    right: -6,
    bottom: -6,
    backgroundColor: colors.foreground,
    borderRadius: radius.sm,
  },
  artworkTile: {
    flex: 1,
    minHeight: 164,
    position: "relative",
    overflow: "hidden",
    backgroundColor: colors.purple,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  sun: {
    position: "absolute",
    top: -22,
    right: 24,
    width: 92,
    height: 92,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 46,
  },
  waveBack: {
    position: "absolute",
    left: -28,
    bottom: -54,
    width: 230,
    height: 122,
    backgroundColor: colors.blue,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 61,
    transform: [{ rotate: "-8deg" }],
  },
  waveFront: {
    position: "absolute",
    right: -34,
    bottom: -66,
    width: 230,
    height: 132,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 66,
    transform: [{ rotate: "10deg" }],
  },
  headphonesBadge: {
    position: "absolute",
    left: spacing.lg,
    top: spacing.lg,
    width: 70,
    height: 70,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
    transform: [{ rotate: "-5deg" }],
  },
  noteBadge: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 46,
    height: 46,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.orange,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
  },
});
