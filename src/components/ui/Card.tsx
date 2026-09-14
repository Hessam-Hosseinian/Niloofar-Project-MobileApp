import { ReactNode } from "react";
import { StyleProp, StyleSheet, Text, ViewStyle } from "react-native";

import { colors, typography } from "@/src/theme";
import { Surface } from "./Surface";

type CardVariant = "default" | "yellow" | "blue" | "pink" | "purple";

type CardProps = {
  children?: ReactNode;

  title?: string;
  description?: string;

  header?: ReactNode;
  footer?: ReactNode;

  variant?: CardVariant;

  largeShadow?: boolean;

  style?: StyleProp<ViewStyle>;
};

const backgrounds: Record<CardVariant, string> = {
  default: colors.white,
  yellow: colors.yellow,

  blue: "rgba(69, 183, 209, 0.20)",
  pink: "rgba(255, 107, 107, 0.20)",
  purple: "rgba(163, 136, 238, 0.20)",
};

export function Card({
  children,
  title,
  description,
  header,
  footer,
  variant = "default",
  largeShadow = false,
  style,
}: CardProps) {
  return (
    <Surface
      backgroundColor={backgrounds[variant]}
      shadow={largeShadow ? "lg" : "md"}
      style={style}
      contentStyle={styles.card}
    >
      {header}

      {title && <Text style={styles.title}>{title}</Text>}

      {description && (
        <Text
          style={[
            styles.description,
            variant === "yellow" && styles.darkDescription,
          ]}
        >
          {description}
        </Text>
      )}

      {children}

      {footer}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    gap: 8,
  },

  title: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 18,
    lineHeight: 27,

    color: colors.foreground,
  },

  description: {
    ...typography.cardBody,
    color: colors.muted,
  },

  darkDescription: {
    color: colors.foreground,
  },
});
