import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, radius } from "@/src/theme";

type BadgeVariant =
  | "default"
  | "secondary"
  | "accent"
  | "destructive"
  | "outline";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  leftIcon?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

const variants = {
  default: {
    backgroundColor: colors.pink,
    textColor: colors.foreground,
  },

  secondary: {
    backgroundColor: colors.purple,
    textColor: colors.foreground,
  },

  accent: {
    backgroundColor: colors.green,
    textColor: colors.foreground,
  },

  destructive: {
    backgroundColor: colors.destructive,
    textColor: colors.white,
  },

  outline: {
    backgroundColor: colors.white,
    textColor: colors.foreground,
  },
};

export function Badge({
  children,
  variant = "default",
  leftIcon,
  style,
}: BadgeProps) {
  const variantStyle = variants[variant];

  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.shadow} />

      <View
        style={[
          styles.badge,
          {
            backgroundColor: variantStyle.backgroundColor,
          },
        ]}
      >
        {leftIcon && <View style={styles.icon}>{leftIcon}</View>}

        <Text
          style={[
            styles.text,
            {
              color: variantStyle.textColor,
            },
          ]}
        >
          {children}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignSelf: "flex-start",
    position: "relative",
  },

  shadow: {
    position: "absolute",

    top: 2,
    left: 2,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,
    borderRadius: radius.pill,
  },

  badge: {
    minHeight: 31,

    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 14,
    paddingVertical: 4,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.pill,

    gap: 4,
  },

  text: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 12.8,
    lineHeight: 19.2,
  },

  icon: {
    width: 12,
    height: 12,

    alignItems: "center",
    justifyContent: "center",
  },
});
