import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { useFocusEffect } from "expo-router";

import { Bike, CreditCard, ShoppingBag } from "lucide-react-native";

import { Badge } from "@/src/components/ui/Badge";
import {
  type ActivityRecord,
  getActivities,
} from "@/src/db/activityRepository";
import { colors, typography } from "@/src/theme";

export default function ActivityScreen() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      async function loadActivities() {
        setLoading(true);

        const result = await getActivities();

        if (active) {
          setActivities(result);
          setLoading(false);
        }
      }

      loadActivities();

      return () => {
        active = false;
      };
    }, []),
  );

  if (loading) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Loading activity...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.eyebrow}>HISTORY</Text>

        <Text style={styles.title}>Activity</Text>

        <Text style={styles.subtitle}>Everything you’ve recently done.</Text>
      </View>

      <View style={styles.filters}>
        <Badge variant="default">All</Badge>

        <Badge variant="outline">Payments</Badge>

        <Badge variant="outline">Services</Badge>

        <Badge variant="outline">Orders</Badge>
      </View>

      <ActivitySection title="Recent">
        {activities.map((activity) => (
          <ActivityItem
            key={activity.id}
            title={activity.title}
            subtitle={activity.subtitle ?? ""}
            meta={formatActivityDate(activity.created_at)}
            amount={formatAmount(activity.amount)}
            icon={getActivityIcon(activity.type)}
            iconBackground={getActivityColor(activity.type)}
          />
        ))}
      </ActivitySection>
    </ScrollView>
  );
}

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type ActivitySectionProps = {
  title: string;
  children: React.ReactNode;
};

function ActivitySection({ title, children }: ActivitySectionProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>

      <View style={styles.activityList}>{children}</View>
    </View>
  );
}

type ActivityItemProps = {
  title: string;
  subtitle: string;
  meta: string;
  amount: string;

  icon: IconType;
  iconBackground: string;
};

function ActivityItem({
  title,
  subtitle,
  meta,
  amount,
  icon: Icon,
  iconBackground,
}: ActivityItemProps) {
  return (
    <View style={styles.itemWrapper}>
      <View style={styles.itemShadow} />

      <View style={styles.item}>
        <View
          style={[
            styles.iconBox,
            {
              backgroundColor: iconBackground,
            },
          ]}
        >
          <Icon size={20} strokeWidth={2.2} color={colors.foreground} />
        </View>

        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{title}</Text>

          <Text style={styles.itemSubtitle}>{subtitle}</Text>

          <Text style={styles.itemMeta}>{meta}</Text>
        </View>

        <Text style={styles.amount}>{amount}</Text>
      </View>
    </View>
  );
}

function getActivityIcon(type: string): IconType {
  switch (type) {
    case "ride":
      return Bike;

    case "order":
      return ShoppingBag;

    default:
      return CreditCard;
  }
}

function getActivityColor(type: string) {
  switch (type) {
    case "ride":
      return colors.green;

    case "order":
      return colors.purple;

    default:
      return colors.pink;
  }
}

function formatAmount(amount: number | null) {
  if (amount === null) {
    return "";
  }

  const sign = amount > 0 ? "+" : "-";

  return `${sign} $${Math.abs(amount).toFixed(2)}`;
}

function formatActivityDate(value: string) {
  const date = new Date(value);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },

  loadingText: {
    ...typography.body,
    color: colors.muted,
  },

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

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  section: {
    gap: 14,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  activityList: {
    gap: 14,
  },

  itemWrapper: {
    position: "relative",
  },

  itemShadow: {
    position: "absolute",

    left: 4,
    top: 4,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,

    borderRadius: 8,
  },

  item: {
    minHeight: 92,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
    padding: 14,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  iconBox: {
    width: 46,
    height: 46,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  itemContent: {
    flex: 1,
  },

  itemTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  itemSubtitle: {
    ...typography.muted,
    color: colors.muted,
    marginTop: 1,
  },

  itemMeta: {
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 11.5,
    lineHeight: 16,

    color: colors.muted,

    marginTop: 4,
  },

  amount: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 14.4,
    lineHeight: 21.6,

    color: colors.foreground,

    marginLeft: 8,
  },
});
