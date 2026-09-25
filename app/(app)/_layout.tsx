import { Stack, usePathname } from "expo-router";
import { View } from "react-native";

import { MusicMiniPlayer } from "@/src/features/music/components/MusicMiniPlayer";
import { MusicPlayerProvider } from "@/src/features/music/services/MusicPlayerProvider";

export default function AppLayout() {
  const pathname = usePathname();
  const isTab = ["/", "/services", "/activity", "/profile"].includes(pathname);
  const isNowPlaying = pathname === "/service/music/now-playing";

  return (
    <MusicPlayerProvider>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{ headerShown: false }}
        />
        {!isTab && !isNowPlaying && <MusicMiniPlayer />}
      </View>
    </MusicPlayerProvider>
  );
}
