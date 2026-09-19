import { ReactNode } from "react";
import { StyleProp, ViewStyle } from "react-native";

import { Button } from "./Button";

type IconButtonVariant =
  | "primary"
  | "secondary"
  | "accent"
  | "destructive"
  | "outline"
  | "ghost";

type IconButtonProps = {
  icon: ReactNode;

  onPress?: () => void;

  variant?: IconButtonVariant;

  disabled?: boolean;
  loading?: boolean;

  style?: StyleProp<ViewStyle>;

  accessibilityLabel: string;
};

export function IconButton({
  icon,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  return (
    <Button
      size="icon"
      variant={variant}
      onPress={onPress}
      disabled={disabled}
      loading={loading}
      style={style as ViewStyle}
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
    </Button>
  );
}
