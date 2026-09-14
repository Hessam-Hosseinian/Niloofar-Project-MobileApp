import { StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { ArrowRight, Sparkles } from "lucide-react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { colors, typography } from "@/src/theme";

import { useAuth } from "@/src/auth/AuthProvider";

export default function OnboardingScreen() {
  const { completeOnboarding } = useAuth();

  async function handleGetStarted() {
    await completeOnboarding();

    router.replace("/(auth)/login");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <View style={styles.iconShadow} />

          <View style={styles.iconBox}>
            <Sparkles size={34} color={colors.foreground} strokeWidth={2.2} />
          </View>
        </View>

        <View>
          <Text style={styles.eyebrow}>YOUR EVERYDAY APP</Text>

          <Text style={styles.title}>
            Everything you need,
            {"\n"}
            in one place.
          </Text>

          <Text style={styles.subtitle}>
            Payments, services, activity and more — all inside one simple app.
          </Text>
        </View>

        <Card
          variant="yellow"
          title="One app. Less friction."
          description="Quick access to your everyday services without jumping between different apps."
        />

        <View style={styles.actions}>
          <Button
            size="large"
            onPress={handleGetStarted}
            rightIcon={<ArrowRight size={18} color={colors.foreground} />}
          >
            Get Started
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    flex: 1,

    justifyContent: "center",

    paddingHorizontal: 24,
    paddingVertical: 48,

    gap: 32,
  },

  iconWrapper: {
    width: 76,
    height: 76,

    position: "relative",
  },

  iconShadow: {
    position: "absolute",

    left: 5,
    top: 5,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  iconBox: {
    width: 76,
    height: 76,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.purple,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },

  title: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 34,
    lineHeight: 42,

    color: colors.foreground,

    marginTop: 8,
  },

  subtitle: {
    ...typography.body,
    color: colors.muted,

    marginTop: 14,
    maxWidth: 340,
  },

  actions: {
    alignItems: "flex-start",
  },
});
