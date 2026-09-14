import { ReactNode } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, radius, typography } from '@/src/theme';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;

  leftIcon?: ReactNode;
  rightElement?: ReactNode;

  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({
  label,
  error,
  leftIcon,
  rightElement,
  editable = true,
  containerStyle,
  style,
  ...props
}: InputProps) {
  const disabled = !editable;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
        </Text>
      )}

      <View style={styles.inputWrapper}>
        <View
          pointerEvents="none"
          style={styles.shadow}
        />

        <View
          style={[
            styles.inputSurface,
            disabled && styles.disabledSurface,
            error && styles.errorSurface,
          ]}
        >
          {leftIcon && (
            <View style={styles.leftIcon}>
              {leftIcon}
            </View>
          )}

          <TextInput
            {...props}
            editable={editable}
            placeholderTextColor="rgba(26, 26, 26, 0.50)"
            selectionColor={colors.foreground}
            style={[
              styles.input,

              leftIcon ? styles.inputWithLeftIcon : undefined,
              rightElement ? styles.inputWithRightElement : undefined,

              disabled && styles.disabledText,

              style,
            ]}
          />

          {rightElement && (
            <View style={styles.rightElement}>
              {rightElement}
            </View>
          )}
        </View>
      </View>

      {error && (
        <Text style={styles.errorText}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },

  label: {
    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 13.6,
    lineHeight: 20.4,
    color: colors.foreground,
  },

  inputWrapper: {
    height: 52,
    position: 'relative',
  },

  shadow: {
    position: 'absolute',

    left: 4,
    top: 4,

    right: -4,
    bottom: 0,

    borderRadius: radius.sm,
    backgroundColor: colors.foreground,
  },

  inputSurface: {
    height: 48,

    position: 'relative',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,

    overflow: 'hidden',
  },

  input: {
    flex: 1,
    height: '100%',

    paddingHorizontal: 16,
    paddingVertical: 10,

    fontFamily: 'SpaceGrotesk_400Regular',
    fontSize: 16,

    color: colors.foreground,
  },

  inputWithLeftIcon: {
    paddingLeft: 40,
  },

  inputWithRightElement: {
    paddingRight: 44,
  },

  leftIcon: {
    position: 'absolute',

    left: 12,

    width: 16,
    height: 16,

    alignItems: 'center',
    justifyContent: 'center',

    zIndex: 1,
  },

  rightElement: {
    position: 'absolute',

    right: 12,

    minWidth: 24,
    height: 32,

    alignItems: 'center',
    justifyContent: 'center',
  },

  errorSurface: {
    borderColor: colors.destructive,
  },

  errorText: {
    ...typography.label,
    letterSpacing: 0,

    color: colors.destructive,
  },

  disabledSurface: {
    opacity: 0.5,
  },

  disabledText: {
    color: colors.muted,
  },
});
