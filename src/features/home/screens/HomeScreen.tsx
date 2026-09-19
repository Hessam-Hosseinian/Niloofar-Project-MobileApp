import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { Bell } from "lucide-react-native";

import { Card } from "@/src/components/ui/Card";
import { IconButton } from "@/src/components/ui/IconButton";
import QuoteCard from "@/src/features/home/components/QuoteCard";
import { quickActions } from "@/src/features/services/serviceCatalog";
import { openService } from "@/src/features/services/openService";
import { colors, typography } from "@/src/theme";

export default function HomeScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>GOOD AFTERNOON</Text>
          <Text style={styles.title}>Welcome back 👋</Text>
        </View>

        <IconButton
          accessibilityLabel="Task reminders"
          variant="outline"
          icon={<Bell size={20} strokeWidth={2.3} color={colors.foreground} />}
          onPress={() => openService("tasks")}
        />
      </View>

      <QuoteCard />

      <Card
        variant="yellow"
        title="Everything in one place"
        description="Access your most important services quickly."
      />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.quickGrid}>
          {quickActions.map((service) => {
            const Icon = service.icon;

            return (
              <QuickAction
                key={service.key}
                title={service.title}
                backgroundColor={service.color}
                icon={<Icon size={24} color={colors.foreground} />}
                onPress={() => openService(service.key)}
              />
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>

          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate("/(app)/(tabs)/activity")}
            hitSlop={10}
          >
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        </View>

        <Card
          title="No recent activity"
          description="Your latest actions will appear here."
        />
      </View>
    </ScrollView>
  );
}

type QuickActionProps = {
  title: string;
  icon: React.ReactNode;
  backgroundColor: string;
  onPress: () => void;
};

function QuickAction({ title, icon, backgroundColor, onPress }: QuickActionProps) {
  return (
    <View style={styles.quickItemWrapper}>
      <View style={styles.quickShadow} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={({ pressed }) => [
          styles.quickItem,
          { backgroundColor },
          pressed && styles.quickPressed,
        ]}
      >
        {icon}
        <Text style={styles.quickLabel}>{title}</Text>
      </Pressable>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },
  title: {
    ...typography.h1,
    color: colors.foreground,
    marginTop: 2,
  },
  section: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },
  seeAll: {
    ...typography.muted,
    color: colors.foreground,
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  quickItemWrapper: {
    position: "relative",
    width: "47%",
  },
  quickShadow: {
    position: "absolute",
    top: 4,
    left: 4,
    width: "100%",
    height: "100%",
    backgroundColor: colors.foreground,
    borderRadius: 8,
  },
  quickItem: {
    minHeight: 112,
    padding: 16,
    justifyContent: "space-between",
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },
  quickPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  quickLabel: {
    ...typography.h4,
    color: colors.foreground,
  },
});
