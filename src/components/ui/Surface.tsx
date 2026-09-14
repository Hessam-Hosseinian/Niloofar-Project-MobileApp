import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius } from "@/src/theme";

type SurfaceShadow = "none" | "sm" | "md" | "lg";

type SurfaceProps = {
  children: ReactNode;
  backgroundColor?: string;
  shadow?: SurfaceShadow;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

const shadowOffsets: Record<SurfaceShadow, { x: number; y: number }> = {
  none: { x: 0, y: 0 },
  sm: { x: 2, y: 2 },
  md: { x: 4, y: 4 },
  lg: { x: 6, y: 6 },
};

export function Surface({
  children,
  backgroundColor = colors.white,
  shadow = "md",
  style,
  contentStyle,
}: SurfaceProps) {
  const offset = shadowOffsets[shadow];

  return (
    <View style={[styles.wrapper, style]}>
      {shadow !== "none" && (
        <View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              top: offset.y,
              left: offset.x,
              right: -offset.x,
              bottom: -offset.y,
            },
          ]}
        />
      )}

      <View
        style={[
          styles.surface,
          {
            backgroundColor,
          },
          contentStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },

  shadow: {
    position: "absolute",
    backgroundColor: colors.foreground,
    borderRadius: radius.sm,
  },

  surface: {
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,

    overflow: "hidden",
  },
});
