import * as SQLite from "expo-sqlite";

import { schema } from "./schema";
import { seedDatabase } from "./seed";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("superapp.db");
  }

  return db;
}

export async function initializeDatabase() {
  const database = await getDatabase();

  await database.execAsync(schema);
  try {
    await database.execAsync(`
    ALTER TABLE tasks
    ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
  `);
  } catch {}

  try {
    await database.execAsync(`
    ALTER TABLE tasks
    ADD COLUMN due_at TEXT;
  `);
  } catch {}

  await seedDatabase(database);
}
