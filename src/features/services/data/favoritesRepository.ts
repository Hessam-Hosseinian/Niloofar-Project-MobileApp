import { getDatabase } from "./database";

export async function getFavoriteKeys() {
  const db = await getDatabase();

  const rows = await db.getAllAsync<{
    service_key: string;
  }>(
    `
    SELECT service_key
    FROM favorites
    ORDER BY id DESC
    `,
  );

  return rows.map((row) => row.service_key);
}

export async function addFavorite(serviceKey: string) {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT OR IGNORE INTO favorites (
      service_key
    )
    VALUES (?)
    `,
    serviceKey,
  );
}

export async function removeFavorite(serviceKey: string) {
  const db = await getDatabase();

  await db.runAsync(
    `
    DELETE FROM favorites
    WHERE service_key = ?
    `,
    serviceKey,
  );
}

export async function toggleFavorite(serviceKey: string) {
  const db = await getDatabase();

  const existing = await db.getFirstAsync<{
    id: number;
  }>(
    `
      SELECT id
      FROM favorites
      WHERE service_key = ?
      `,
    serviceKey,
  );

  if (existing) {
    await removeFavorite(serviceKey);

    return false;
  }

  await addFavorite(serviceKey);

  return true;
}
