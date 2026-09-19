import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Heart, Search } from "lucide-react-native";

import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { useFavorites } from "@/src/features/services/hooks/useFavorites";
import { openService } from "@/src/features/services/openService";
import {
  type ServiceCategory,
  services,
} from "@/src/features/services/serviceCatalog";
import { colors, typography } from "@/src/theme";

const categories: {
  key: ServiceCategory | "all";
  title: string;
  color: string;
}[] = [
  {
    key: "all",
    title: "All",
    color: colors.blue,
  },
  {
    key: "core",
    title: "Core",
    color: colors.yellow,
  },
  {
    key: "productivity",
    title: "Productivity",
    color: colors.green,
  },
  {
    key: "life",
    title: "Life",
    color: colors.pink,
  },
  {
    key: "utility",
    title: "Utilities",
    color: colors.orange,
  },
  {
    key: "system",
    title: "System",
    color: colors.purple,
  },
];

export default function ServicesScreen() {
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<
    ServiceCategory | "all"
  >("all");

  const { favoriteKeys, toggle, isFavorite } = useFavorites();

  const favoriteServices = services.filter((service) =>
    favoriteKeys.includes(service.key),
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return services.filter((service) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        service.title.toLowerCase().includes(normalizedQuery) ||
        service.subtitle.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        selectedCategory === "all" || service.category === selectedCategory;

      return matchesQuery && matchesCategory;
    });
  }, [query, selectedCategory]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.eyebrow}>DISCOVER</Text>

        <Text style={styles.title}>Services</Text>

        <Text style={styles.subtitle}>
          Find everything you need in one place.
        </Text>
      </View>

      <Input
        placeholder="Search services..."
        value={query}
        onChangeText={setQuery}
        leftIcon={<Search size={16} color={colors.foreground} />}
      />

      {favoriteServices.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Favorites</Text>

          <View style={styles.favoriteGrid}>
            {favoriteServices.map((service) => {
              const Icon = service.icon;

              return (
                <View key={service.key} style={styles.favoriteWrapper}>
                  <View style={styles.favoriteShadow} />

                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Open ${service.title}`}
                    onPress={() => openService(service.key)}
                    style={[
                      styles.favoriteTile,
                      { backgroundColor: service.color },
                    ]}
                  >
                    <View style={styles.favoriteTop}>
                      <Icon size={22} color={colors.foreground} />

                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Remove ${service.title} from favorites`}
                        onPress={(event) => {
                          event.stopPropagation();
                          void toggle(service.key);
                        }}
                        hitSlop={10}
                      >
                        <Heart
                          size={20}
                          color={colors.foreground}
                          fill={colors.foreground}
                        />
                      </Pressable>
                    </View>

                    <Text style={styles.favoriteTitle}>{service.title}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured</Text>

        <Card
          variant="purple"
          title="Popular right now"
          description="Quick access to the most used services."
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>

        <View style={styles.categoryGrid}>
          {categories.map((category) => (
            <CategoryTile
              key={category.key}
              title={category.title}
              backgroundColor={category.color}
              selected={selectedCategory === category.key}
              onPress={() => setSelectedCategory(category.key)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Services</Text>

        <View style={styles.serviceList}>
          {filteredServices.map((service) => {
            const Icon = service.icon;

            return (
              <ServiceRow
                key={service.key}
                title={service.title}
                subtitle={service.subtitle}
                icon={Icon}
                iconBackground={service.color}
                favorite={isFavorite(service.key)}
                onToggleFavorite={() => toggle(service.key)}
                onPress={() => openService(service.key)}
              />
            );
          })}

          {filteredServices.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No services found</Text>

              <Text style={styles.emptyText}>
                Try another search or category.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

type IconType = React.ComponentType<{
  size?: number;
  color?: string;
  strokeWidth?: number;
}>;

type CategoryTileProps = {
  title: string;
  backgroundColor: string;
  selected?: boolean;
  onPress?: () => void;
};

function CategoryTile({
  title,
  backgroundColor,
  selected = false,
  onPress,
}: CategoryTileProps) {
  return (
    <View style={styles.categoryWrapper}>
      <View style={styles.categoryShadow} />

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.categoryTile,
          {
            backgroundColor: selected ? backgroundColor : colors.white,
          },
          pressed && styles.categoryPressed,
        ]}
      >
        <Text style={styles.categoryTitle}>{title}</Text>
      </Pressable>
    </View>
  );
}

type ServiceRowProps = {
  title: string;
  subtitle: string;
  icon: IconType;
  iconBackground: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onPress: () => void;
};

function ServiceRow({
  title,
  subtitle,
  icon: Icon,
  iconBackground,
  favorite,
  onToggleFavorite,
  onPress,
}: ServiceRowProps) {
  return (
    <View style={styles.serviceWrapper}>
      <View style={styles.serviceShadow} />

      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.serviceRow,
          pressed && {
            transform: [{ translateX: 2 }, { translateY: 2 }],
          },
        ]}
      >
        <View style={[styles.serviceIcon, { backgroundColor: iconBackground }]}>
          <Icon size={20} color={colors.foreground} />
        </View>

        <View style={styles.serviceText}>
          <Text style={styles.serviceTitle}>{title}</Text>

          <Text style={styles.serviceSubtitle}>{subtitle}</Text>
        </View>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          hitSlop={10}
          style={styles.favoriteButton}
        >
          <Heart
            size={21}
            strokeWidth={2.2}
            color={colors.foreground}
            fill={favorite ? colors.pink : "transparent"}
          />
        </Pressable>
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

  section: {
    gap: 14,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  favoriteButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",
  },

  favoriteGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  favoriteWrapper: {
    position: "relative",
    width: "47%",
  },

  favoriteShadow: {
    position: "absolute",

    left: 4,
    top: 4,
    right: -4,
    bottom: -4,

    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  favoriteTile: {
    minHeight: 100,

    padding: 14,

    justifyContent: "space-between",

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  favoriteTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  favoriteTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },

  categoryWrapper: {
    width: "47%",
    position: "relative",
  },

  categoryShadow: {
    position: "absolute",
    left: 4,
    top: 4,
    width: "100%",
    height: "100%",
    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  categoryTile: {
    minHeight: 96,
    padding: 16,

    justifyContent: "space-between",

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  categoryTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  categoryPressed: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },

  serviceList: {
    gap: 14,
  },

  serviceWrapper: {
    position: "relative",
  },

  serviceShadow: {
    position: "absolute",
    left: 4,
    top: 4,
    width: "100%",
    height: "100%",
    backgroundColor: colors.foreground,
    borderRadius: 8,
  },

  serviceRow: {
    minHeight: 76,

    flexDirection: "row",
    alignItems: "center",

    padding: 14,
    gap: 12,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  serviceIcon: {
    width: 42,
    height: 42,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  serviceText: {
    flex: 1,
  },

  serviceTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  serviceSubtitle: {
    ...typography.muted,
    color: colors.muted,
    marginTop: 2,
  },

  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 6,
  },

  emptyTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  emptyText: {
    ...typography.muted,
    color: colors.muted,
  },
});
