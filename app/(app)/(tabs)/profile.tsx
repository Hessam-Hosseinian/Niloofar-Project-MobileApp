import { ScrollView, StyleSheet, Text, View } from "react-native";

import { router } from "expo-router";

import {
  Bell,
  ChevronRight,
  CircleHelp,
  LogOut,
  Settings,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react-native";

import { useAuth } from "@/src/auth/AuthProvider";
import { Button } from "@/src/components/ui/Button";
import { colors, typography } from "@/src/theme";

export default function ProfileScreen() {
  const { logout } = useAuth();

  async function handleLogout() {
    await logout();

    router.replace("/(auth)/login");
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.eyebrow}>ACCOUNT</Text>

        <Text style={styles.title}>Profile</Text>

        <Text style={styles.subtitle}>
          Manage your account and preferences.
        </Text>
      </View>

      <View style={styles.profileWrapper}>
        <View style={styles.profileShadow} />

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserRound size={28} strokeWidth={2.2} color={colors.foreground} />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>Jane Doe</Text>

            <Text style={styles.profileMeta}>jane@example.com</Text>
          </View>

          <ChevronRight size={20} color={colors.foreground} />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <MenuItem
          title="Personal information"
          subtitle="Name, phone and email"
          icon={UserRound}
          backgroundColor={colors.pink}
        />

        <MenuItem
          title="Wallet & payments"
          subtitle="Cards and payment methods"
          icon={WalletCards}
          backgroundColor={colors.yellow}
        />

        <MenuItem
          title="Security"
          subtitle="Password and privacy"
          icon={ShieldCheck}
          backgroundColor={colors.green}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <MenuItem
          title="Notifications"
          subtitle="Manage alerts and updates"
          icon={Bell}
          backgroundColor={colors.blue}
        />

        <MenuItem
          title="Settings"
          subtitle="App preferences"
          icon={Settings}
          backgroundColor={colors.purple}
        />

        <MenuItem
          title="Help & support"
          subtitle="FAQ and contact"
          icon={CircleHelp}
          backgroundColor={colors.orange}
        />
      </View>

      <Button
        variant="destructive"
        size="large"
        onPress={handleLogout}
        leftIcon={<LogOut size={20} color={colors.white} />}
      >
        Log out
      </Button>
    </ScrollView>
  );
}

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type MenuItemProps = {
  title: string;
  subtitle: string;
  icon: IconType;
  backgroundColor: string;
};

function MenuItem({
  title,
  subtitle,
  icon: Icon,
  backgroundColor,
}: MenuItemProps) {
  return (
    <View style={styles.menuWrapper}>
      <View style={styles.menuShadow} />

      <View style={styles.menuItem}>
        <View
          style={[
            styles.menuIcon,
            {
              backgroundColor,
            },
          ]}
        >
          <Icon size={20} strokeWidth={2.2} color={colors.foreground} />
        </View>

        <View style={styles.menuContent}>
          <Text style={styles.menuTitle}>{title}</Text>

          <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>

        <ChevronRight size={20} color={colors.foreground} />
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
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 28,
  },

  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },

  title: {
    ...typography.h1,
    color: colors.foreground,
  },

  subtitle: {
    ...typography.body,
    color: colors.muted,
    marginTop: 4,
  },

  profileWrapper: {
    position: "relative",
  },

  profileShadow: {
    position: "absolute",

    left: 4,
    top: 4,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  profileCard: {
    minHeight: 92,

    flexDirection: "row",
    alignItems: "center",

    gap: 14,
    padding: 16,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  avatar: {
    width: 54,
    height: 54,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.purple,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 999,
  },

  profileInfo: {
    flex: 1,
  },

  profileName: {
    ...typography.h3,
    color: colors.foreground,
  },

  profileMeta: {
    ...typography.muted,
    color: colors.muted,
    marginTop: 2,
  },

  section: {
    gap: 14,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  menuWrapper: {
    position: "relative",
  },

  menuShadow: {
    position: "absolute",

    left: 4,
    top: 4,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  menuItem: {
    minHeight: 74,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
    padding: 14,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  menuIcon: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  menuContent: {
    flex: 1,
  },

  menuTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  menuSubtitle: {
    ...typography.muted,
    color: colors.muted,
    marginTop: 2,
  },

});
