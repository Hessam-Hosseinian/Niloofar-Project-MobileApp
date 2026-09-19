import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { AuthProvider } from "@/src/auth/AuthProvider";
import { initializeDatabase } from "@/src/db/database";
import { initializeNotifications } from "@/src/features/tasks/notifications";
import { HabitNotificationObserver } from "@/src/features/habits/HabitNotificationObserver";
import { useAppStore } from "@/src/store/appStore";
import { colors } from "@/src/theme";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const isReady = useAppStore((state) => state.isReady);
  const setReady = useAppStore((state) => state.setReady);
  const [startupError, setStartupError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function prepareApp() {
      try {
        await initializeDatabase();
        if (active) {
          setStartupError(false);
          setReady(true);
          // Notification setup can ask for permission, so it must not delay navigation.
          void initializeNotifications();
        }
      } catch (error) {
        console.warn("Unable to initialize app database", error);
        if (active) setStartupError(true);
      }
    }

    void prepareApp();
    return () => {
      active = false;
    };
  }, [retryCount, setReady]);

  useEffect(() => {
    if (fontsLoaded && (isReady || startupError)) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isReady, startupError]);

  if (!fontsLoaded) {
    return null;
  }

  if (startupError) {
    return (
      <View style={styles.errorScreen}>
        <Text style={styles.errorTitle}>Could not start the app</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setStartupError(false);
            setRetryCount((count) => count + 1);
          }}
          style={styles.retryButton}
        >
          <Text style={styles.retryLabel}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (!isReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SafeAreaView edges={["top", "left", "right"]} style={styles.appShell}>
        <AuthProvider>
          <HabitNotificationObserver />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background },
            }}
          />
        </AuthProvider>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.background,
  },
  errorScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    backgroundColor: colors.background,
  },
  errorTitle: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 20,
    color: colors.foreground,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderWidth: 2,
    borderColor: colors.foreground,
    backgroundColor: colors.yellow,
  },
  retryLabel: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: colors.foreground,
  },
});
