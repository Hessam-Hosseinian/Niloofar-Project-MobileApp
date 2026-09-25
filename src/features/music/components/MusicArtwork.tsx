import { Disc3, Music2, Radio } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { colors, radius } from "@/src/theme";

type Props = { seed: string; size?: number };
const palette = [colors.pink, colors.purple, colors.green, colors.yellow, colors.blue, colors.orange];

export function MusicArtwork({ seed, size = 56 }: Props) {
  const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % palette.length;
  const Icon = [Disc3, Music2, Radio][index % 3];
  return (
    <View
      accessibilityElementsHidden
      style={[
        styles.container,
        { width: size, height: size, backgroundColor: palette[index] },
      ]}
    >
      <View style={styles.corner} />
      <Icon size={size * 0.48} strokeWidth={2.2} color={colors.foreground} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },
  corner: {
    position: "absolute",
    width: "60%",
    height: "60%",
    right: -8,
    top: -8,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    opacity: 0.5,
  },
});
