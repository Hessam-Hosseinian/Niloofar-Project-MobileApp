import { Stack } from "expo-router";
import { useEffect } from "react";
import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
  useFonts,
} from "@expo-google-fonts/space-grotesk";

import { AuthProvider } from "@/src/auth/AuthProvider";
import { initializeDatabase } from "@/src/db/database";
import { useAppStore } from "@/src/store/appStore";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  const isReady = useAppStore((state) => state.isReady);
  const setReady = useAppStore((state) => state.setReady);

  useEffect(() => {
    async function prepareApp() {
      await initializeDatabase();
      setReady(true);
    }

    prepareApp();
  }, [setReady]);

  if (!fontsLoaded || !isReady) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
