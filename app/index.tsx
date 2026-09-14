import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "@/src/auth/AuthProvider";
import { colors } from "@/src/theme";

export default function Index() {
  const { isLoading, isLoggedIn, hasSeenOnboarding } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.foreground} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(app)/(tabs)" />;
  }

  if (!hasSeenOnboarding) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return <Redirect href="/(auth)/login" />;
}
