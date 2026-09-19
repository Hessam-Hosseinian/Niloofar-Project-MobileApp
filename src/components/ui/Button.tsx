import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { colors, radius, typography } from "@/src/theme";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "destructive"
  | "outline"
  | "ghost";

type ButtonSize = "small" | "medium" | "large" | "icon";

type ButtonProps = {
  children?: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;

  disabled?: boolean;
  loading?: boolean;

  onPress?: () => void;
  accessibilityLabel?: string;

  leftIcon?: ReactNode;
  rightIcon?: ReactNode;

  style?: ViewStyle;
};

const variantStyles = {
  primary: {
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

  ghost: {
    backgroundColor: "transparent",
    textColor: colors.foreground,
  },
};

const sizeStyles = {
  small: {
    minHeight: 32,
    paddingHorizontal: 14,
  },

  medium: {
    minHeight: 44,
    paddingHorizontal: 22,
  },

  large: {
    minHeight: 54,
    paddingHorizontal: 30,
  },

  icon: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
  },
};

export function Button({
  children,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  onPress,
  accessibilityLabel,
  leftIcon,
  rightIcon,
  style,
}: ButtonProps) {
  const variantStyle = variantStyles[variant];
  const sizeStyle = sizeStyles[size];

  const hasShadow = variant !== "ghost";

  return (
    <View style={[styles.wrapper, style]}>
      {hasShadow && (
        <View
          pointerEvents="none"
          style={[
            styles.shadow,
            {
              borderRadius: radius.sm,
            },
          ]}
        />
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled || loading}
        onPress={onPress}
        style={({ pressed }) => [
          styles.button,

          sizeStyle,

          {
            backgroundColor: variantStyle.backgroundColor,
          },

          variant !== "ghost" && styles.border,

          disabled && styles.disabled,

          pressed && hasShadow && styles.pressed,

          size === "icon" && styles.iconButton,
        ]}
      >
        {loading ? (
          <ActivityIndicator size="small" color={variantStyle.textColor} />
        ) : (
          <>
            {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

            {children &&
              (typeof children === "string" || typeof children === "number" ? (
                <Text
                  style={[
                    typography.button,
                    {
                      color: variantStyle.textColor,
                    },
                  ]}
                >
                  {children}
                </Text>
              ) : (
                children
              ))}

            {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
          </>
        )}
      </Pressable>
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

    top: 4,
    left: 4,
    right: -4,
    bottom: -4,

    backgroundColor: colors.foreground,
  },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    borderRadius: radius.sm,
  },

  border: {
    borderWidth: 2,
    borderColor: colors.foreground,
  },

  pressed: {
    transform: [
      {
        translateX: 4,
      },
      {
        translateY: 4,
      },
    ],
  },

  disabled: {
    opacity: 0.5,
  },

  iconButton: {
    paddingHorizontal: 0,
  },

  leftIcon: {
    marginRight: 8,
  },

  rightIcon: {
    marginLeft: 8,
  },
});
