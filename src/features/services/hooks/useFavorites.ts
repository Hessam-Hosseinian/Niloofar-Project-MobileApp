import { useCallback, useState } from "react";

import { useFocusEffect } from "expo-router";

import { getFavoriteKeys, toggleFavorite } from "@/src/db/favoritesRepository";

export function useFavorites() {
  const [favoriteKeys, setFavoriteKeys] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    setLoading(true);

    const keys = await getFavoriteKeys();

    setFavoriteKeys(keys);

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  async function toggle(serviceKey: string) {
    const isFavorite = await toggleFavorite(serviceKey);

    setFavoriteKeys((current) => {
      if (isFavorite) {
        return [serviceKey, ...current.filter((key) => key !== serviceKey)];
      }

      return current.filter((key) => key !== serviceKey);
    });
  }

  function isFavorite(serviceKey: string) {
    return favoriteKeys.includes(serviceKey);
  }

  return {
    favoriteKeys,
    loading,
    toggle,
    isFavorite,
    refresh: loadFavorites,
  };
}
