import * as SQLite from "expo-sqlite";

import { schema } from "./schema";
import { seedDatabase } from "./seed";

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase() {
  if (!db) {
    db = await SQLite.openDatabaseAsync("superapp.db");
    await db.execAsync("PRAGMA foreign_keys = ON;");
  }

  return db;
}

type TableInfoRow = {
  name: string;
};

async function addTaskColumnIfMissing(
  database: SQLite.SQLiteDatabase,
  columnName: string,
  definition: string,
) {
  const columns = await database.getAllAsync<TableInfoRow>(
    "PRAGMA table_info(tasks)",
  );

  if (columns.some((column) => column.name === columnName)) {
    return;
  }

  await database.execAsync(`ALTER TABLE tasks ADD COLUMN ${definition};`);
}

async function addColumnIfMissing(
  database: SQLite.SQLiteDatabase,
  table: "habits" | "habit_logs" | "habit_revisions",
  columnName: string,
  definition: string,
) {
  const columns = await database.getAllAsync<TableInfoRow>(`PRAGMA table_info(${table})`);
  if (!columns.some((column) => column.name === columnName)) {
    await database.execAsync(`ALTER TABLE ${table} ADD COLUMN ${definition};`);
  }
}

export async function initializeDatabase() {
  const database = await getDatabase();

  await database.execAsync(schema);

  await addTaskColumnIfMissing(
    database,
    "priority",
    "priority TEXT NOT NULL DEFAULT 'normal'",
  );
  await addTaskColumnIfMissing(database, "due_at", "due_at TEXT");
  await addTaskColumnIfMissing(database, "planned_day", "planned_day TEXT");
  await addTaskColumnIfMissing(
    database,
    "repeat_type",
    "repeat_type TEXT NOT NULL DEFAULT 'none'",
  );
  await addTaskColumnIfMissing(
    database,
    "repeat_interval",
    "repeat_interval INTEGER NOT NULL DEFAULT 1",
  );
  await addTaskColumnIfMissing(
    database,
    "next_occurrence_created",
    "next_occurrence_created INTEGER NOT NULL DEFAULT 0",
  );
  await addTaskColumnIfMissing(
    database,
    "reminder_minutes",
    "reminder_minutes INTEGER",
  );
  await addTaskColumnIfMissing(
    database,
    "notification_id",
    "notification_id TEXT",
  );

  await addColumnIfMissing(database, "habits", "cue", "cue TEXT");
  await addColumnIfMissing(database, "habits", "weekdays", "weekdays INTEGER NOT NULL DEFAULT 127");
  await addColumnIfMissing(database, "habits", "target_count", "target_count INTEGER NOT NULL DEFAULT 1");
  await addColumnIfMissing(database, "habits", "unit", "unit TEXT NOT NULL DEFAULT 'times'");
  await addColumnIfMissing(database, "habits", "reminder_time", "reminder_time TEXT");
  await addColumnIfMissing(database, "habits", "notification_ids", "notification_ids TEXT");
  await addColumnIfMissing(database, "habits", "archived", "archived INTEGER NOT NULL DEFAULT 0");
  await addColumnIfMissing(database, "habits", "start_day", "start_day TEXT");
  await database.execAsync("UPDATE habits SET start_day = date(created_at, 'localtime') WHERE start_day IS NULL;");
  await addColumnIfMissing(database, "habit_logs", "count", "count INTEGER NOT NULL DEFAULT 1");
  await addColumnIfMissing(database, "habit_logs", "skipped", "skipped INTEGER NOT NULL DEFAULT 0");
  await database.execAsync("CREATE INDEX IF NOT EXISTS habit_logs_day_idx ON habit_logs(day);");
  await addColumnIfMissing(database, "habit_revisions", "unit", "unit TEXT NOT NULL DEFAULT ''");
  await database.execAsync(`UPDATE habit_revisions SET unit = COALESCE(
    (SELECT habits.unit FROM habits WHERE habits.id = habit_revisions.habit_id),
    'times'
  ) WHERE unit = '';`);
  await database.execAsync(`INSERT OR IGNORE INTO habit_revisions
    (habit_id, effective_day, weekdays, target_count, unit, archived)
    SELECT id, start_day, weekdays, target_count, unit, 0 FROM habits WHERE start_day IS NOT NULL;`);
  await database.execAsync(`INSERT INTO habit_revisions
    (habit_id, effective_day, weekdays, target_count, unit, archived)
    SELECT id, date('now', 'localtime'), weekdays, target_count, unit, 1
    FROM habits WHERE archived = 1
    ON CONFLICT(habit_id, effective_day) DO UPDATE SET archived = 1;`);

  await database.execAsync("PRAGMA foreign_keys = ON;");
  await seedDatabase(database);
}
