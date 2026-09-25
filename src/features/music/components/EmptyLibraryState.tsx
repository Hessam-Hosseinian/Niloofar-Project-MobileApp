import { Disc3, FolderHeart } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";

import { Surface } from "@/src/components/ui/Surface";
import { colors, radius, spacing, typography } from "@/src/theme";

export function EmptyLibraryState() {
  return (
    <Surface shadow="md" contentStyle={styles.surface}>
      <View accessibilityElementsHidden style={styles.illustration}>
        <View style={styles.discShadow} />
        <View style={styles.disc}>
          <Disc3 size={42} strokeWidth={1.8} color={colors.foreground} />
        </View>

        <View style={styles.folderBadge}>
          <FolderHeart size={19} strokeWidth={2.3} color={colors.foreground} />
        </View>
      </View>

      <View style={styles.copy}>
        <Text accessibilityRole="header" style={styles.title}>
          Your library is quiet
        </Text>

        <Text style={styles.description}>
          Scan songs on your Android phone or import audio files to start your
          own collection.
        </Text>
      </View>

      <View style={styles.note}>
        <View style={styles.noteMark} />
        <Text style={styles.noteText}>
          Your music stays on this device. No account or streaming service is
          needed.
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  surface: {
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.xl,
  },
  illustration: {
    width: 104,
    height: 98,
    position: "relative",
  },
  discShadow: {
    position: "absolute",
    left: 8,
    top: 8,
    width: 82,
    height: 82,
    backgroundColor: colors.foreground,
    borderRadius: 41,
  },
  disc: {
    width: 82,
    height: 82,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.purple,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 41,
  },
  folderBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  copy: {
    alignItems: "center",
    gap: spacing.sm,
  },
  title: {
    ...typography.h2,
    fontFamily: "SpaceGrotesk_600SemiBold",
    textAlign: "center",
    color: colors.foreground,
  },
  description: {
    ...typography.body,
    maxWidth: 310,
    textAlign: "center",
    color: colors.muted,
  },
  note: {
    width: "100%",
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  noteMark: {
    width: 10,
    height: 32,
    backgroundColor: colors.green,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 5,
  },
  noteText: {
    ...typography.muted,
    flex: 1,
    color: colors.foreground,
  },
});
