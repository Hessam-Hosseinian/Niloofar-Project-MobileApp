import { ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { ArrowLeft, Heart } from "lucide-react-native";

import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { IconButton } from "@/src/components/ui/IconButton";

import { getServiceByKey } from "@/src/features/services/serviceCatalog";

import { useFavorites } from "@/src/features/services/hooks/useFavorites";

import { colors, typography } from "@/src/theme";

export default function ServiceDetailScreen() {
  const { serviceKey } = useLocalSearchParams<{
    serviceKey: string;
  }>();

  const service = getServiceByKey(serviceKey);

  const { isFavorite, toggle } = useFavorites();

  if (!service) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Service not found</Text>

        <Button variant="outline" onPress={() => router.back()}>
          Go back
        </Button>
      </View>
    );
  }

  const Icon = service.icon;

  const favorite = isFavorite(service.key);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          variant="outline"
          icon={<ArrowLeft size={20} color={colors.foreground} />}
          onPress={() => router.back()}
        />

        <IconButton
          accessibilityLabel={
            favorite ? "Remove from favorites" : "Add to favorites"
          }
          variant={favorite ? "primary" : "outline"}
          icon={
            <Heart
              size={20}
              color={colors.foreground}
              fill={favorite ? colors.foreground : "transparent"}
            />
          }
          onPress={() => toggle(service.key)}
        />
      </View>

      <View style={styles.heroWrapper}>
        <View style={styles.heroShadow} />

        <View
          style={[
            styles.hero,
            {
              backgroundColor: service.color,
            },
          ]}
        >
          <View style={styles.iconBox}>
            <Icon size={34} strokeWidth={2.2} color={colors.foreground} />
          </View>

          <View>
            <Text style={styles.category}>
              {service.category.toUpperCase()}
            </Text>

            <Text style={styles.title}>{service.title}</Text>

            <Text style={styles.subtitle}>{service.subtitle}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <Card title={service.title} description={service.subtitle} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>

        <Card
          variant="yellow"
          title="Service workspace"
          description="The actions and features for this service will appear here."
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 40,
    gap: 28,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  heroWrapper: {
    position: "relative",
  },

  heroShadow: {
    position: "absolute",

    left: 6,
    top: 6,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  hero: {
    minHeight: 220,

    justifyContent: "space-between",

    padding: 22,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  iconBox: {
    width: 64,
    height: 64,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  category: {
    ...typography.label,
    color: colors.foreground,
  },

  title: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 30,
    lineHeight: 38,

    color: colors.foreground,

    marginTop: 2,
  },

  subtitle: {
    ...typography.body,
    color: colors.foreground,

    marginTop: 6,
  },

  section: {
    gap: 14,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  notFound: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    gap: 20,

    padding: 24,

    backgroundColor: colors.background,
  },

  notFoundTitle: {
    ...typography.h2,
    color: colors.foreground,
  },
});
