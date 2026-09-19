import type { BottomTabBarProps } from "expo-router/js-tabs";

import { History, Home, LayoutGrid, User } from "lucide-react-native";

import * as Haptics from "expo-haptics";

import { Pressable, StyleSheet, Text, View } from "react-native";

import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius } from "@/src/theme";

const tabs = {
  index: {
    label: "Home",
    icon: Home,
    activeColor: colors.yellow,
  },

  services: {
    label: "Services",
    icon: LayoutGrid,
    activeColor: colors.green,
  },

  activity: {
    label: "Activity",
    icon: History,
    activeColor: colors.blue,
  },

  profile: {
    label: "Profile",
    icon: User,
    activeColor: colors.purple,
  },
} as const;

export function BottomTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <View style={styles.shadow} />

      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const config = tabs[route.name as keyof typeof tabs];

          if (!config) {
            return null;
          }

          const focused = state.index === index;

          const Icon = config.icon;

          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
              void Haptics.selectionAsync().catch(() => {});
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              style={({ pressed }) => [
                styles.tab,

                focused && [
                  styles.activeTab,
                  {
                    backgroundColor: config.activeColor,
                  },
                ],

                pressed && styles.pressed,
              ]}
            >
              <Icon size={21} strokeWidth={2.3} color={colors.foreground} />

              <Text style={[styles.label, focused && styles.activeLabel]}>
                {config.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",

    backgroundColor: colors.background,

    paddingHorizontal: 16,
    paddingTop: 8,
  },

  shadow: {
    position: "absolute",

    top: 12,
    left: 20,
    right: 12,
    bottom: 8,

    borderRadius: radius.sm,
    backgroundColor: colors.foreground,
  },

  bar: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    padding: 6,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
  },

  tab: {
    flex: 1,

    minHeight: 52,

    alignItems: "center",
    justifyContent: "center",

    gap: 3,

    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 7,
  },

  activeTab: {
    borderColor: colors.foreground,
  },

  pressed: {
    transform: [{ translateX: 1 }, { translateY: 1 }],
  },

  label: {
    fontFamily: "SpaceGrotesk_400Regular",

    fontSize: 11.5,
    lineHeight: 15,

    color: colors.foreground,
  },

  activeLabel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
  },
});
