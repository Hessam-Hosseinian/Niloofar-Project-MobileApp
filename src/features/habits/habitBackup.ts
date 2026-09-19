import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { getDatabase } from "@/src/db/database";
import { getLocalDay, type Habit, type HabitLog, type HabitRevision } from "./habitsRepository";
import { parseHabitBackup, type HabitBackup } from "./habitBackupValidation";

export type { HabitBackup } from "./habitBackupValidation";

export async function createHabitBackup(): Promise<HabitBackup> {
  const db = await getDatabase();
  const [habits, logs, revisions] = await Promise.all([
    db.getAllAsync<Habit>("SELECT * FROM habits ORDER BY id"),
    db.getAllAsync<HabitLog>("SELECT * FROM habit_logs ORDER BY id"),
    db.getAllAsync<HabitRevision>("SELECT * FROM habit_revisions ORDER BY habit_id, effective_day"),
  ]);
  return { version: 1, exported_at: new Date().toISOString(), habits, logs, revisions };
}

export async function shareHabitBackup() {
  if (!await Sharing.isAvailableAsync()) throw new Error("Sharing is unavailable on this device.");
  const backup = await createHabitBackup();
  const file = new File(Paths.cache, `super-app-habits-${getLocalDay()}-${Date.now()}.json`);
  file.create();
  file.write(JSON.stringify(backup, null, 2));
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Export habits" });
}

export async function pickHabitBackup(): Promise<HabitBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
  if (result.canceled) return null;
  const file = new File(result.assets[0].uri);
  if (file.size && file.size > 10_000_000) throw new Error("Backup file is too large.");
  return parseHabitBackup(await file.text());
}

export async function restoreHabitBackup(backup: HabitBackup) {
  const db = await getDatabase();
  await db.withExclusiveTransactionAsync(async (tx) => {
    await tx.runAsync("DELETE FROM habits");
    for (const habit of backup.habits) {
      await tx.runAsync(
        `INSERT INTO habits (id, title, color, cue, weekdays, target_count, unit, reminder_time, notification_ids, archived, start_day, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)`,
        habit.id, habit.title, habit.color, habit.cue, habit.weekdays, habit.target_count,
        habit.unit, habit.reminder_time, habit.archived, habit.start_day, habit.created_at,
      );
    }
    for (const revision of backup.revisions) {
      await tx.runAsync(
        "INSERT INTO habit_revisions (habit_id, effective_day, weekdays, target_count, unit, archived) VALUES (?, ?, ?, ?, ?, ?)",
        revision.habit_id, revision.effective_day, revision.weekdays, revision.target_count, revision.unit, revision.archived,
      );
    }
    for (const log of backup.logs) {
      await tx.runAsync(
        "INSERT INTO habit_logs (id, habit_id, day, completed, count, skipped, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
        log.id, log.habit_id, log.day, log.completed, log.count, log.skipped, log.created_at,
      );
    }
  });
}
