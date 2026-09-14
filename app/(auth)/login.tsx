import { StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import { LockKeyhole, Mail } from "lucide-react-native";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { useAuth } from "@/src/auth/AuthProvider";
import { colors, typography } from "@/src/theme";

export default function LoginScreen() {
  const { login } = useAuth();

  async function handleLogin() {
    await login();

    router.replace("/(app)/(tabs)");
  }

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>

          <Text style={styles.title}>Log in</Text>

          <Text style={styles.subtitle}>
            Enter your account details to continue.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email"
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={16} color={colors.foreground} />}
          />

          <Input
            label="Password"
            placeholder="Enter your password"
            secureTextEntry
            leftIcon={<LockKeyhole size={16} color={colors.foreground} />}
          />
        </View>

        <Button size="large" onPress={handleLogin}>
          Log in
        </Button>

        <Text style={styles.helper}>
          For now, this button uses a mock login.
        </Text>
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

    gap: 28,
  },

  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },

  title: {
    ...typography.h1,
    color: colors.foreground,

    marginTop: 4,
  },

  subtitle: {
    ...typography.body,
    color: colors.muted,

    marginTop: 6,
  },

  form: {
    gap: 20,
  },

  helper: {
    ...typography.muted,
    color: colors.muted,
  },
});
