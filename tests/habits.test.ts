/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import { parseHabitBackup } from "../src/features/habits/habitBackupValidation";
import { getRuleForDay, isScheduledOnDay } from "../src/features/habits/habitRules";
import { getHabitStats } from "../src/features/habits/habitStats";
import type { Habit, HabitLog, HabitRevision } from "../src/features/habits/habitsRepository";

const habit: Habit = {
  id: 1, title: "Read", color: "#45B7D1", cue: null, weekdays: 127,
  target_count: 5, unit: "chapters", reminder_time: null, notification_ids: null,
  archived: 0, start_day: "2026-09-08", created_at: "2026-09-08T08:00:00.000Z",
};
const revisions: HabitRevision[] = [
  { habit_id: 1, effective_day: "2026-09-08", weekdays: 127, target_count: 2, unit: "pages", archived: 0 },
  { habit_id: 1, effective_day: "2026-09-10", weekdays: 127, target_count: 5, unit: "chapters", archived: 0 },
  { habit_id: 1, effective_day: "2026-09-11", weekdays: 127, target_count: 5, unit: "chapters", archived: 1 },
  { habit_id: 1, effective_day: "2026-09-14", weekdays: 127, target_count: 5, unit: "chapters", archived: 0 },
];
const log = (id: number, day: string, count: number, skipped = 0): HabitLog => ({
  id, habit_id: 1, day, count, skipped, completed: skipped ? 0 : 1,
  created_at: `${day}T12:00:00.000Z`,
});

test("edits use the goal and unit that applied on each day", () => {
  assert.equal(getRuleForDay(habit, revisions, "2026-09-09").target_count, 2);
  assert.equal(getRuleForDay(habit, revisions, "2026-09-09").unit, "pages");
  assert.equal(getRuleForDay(habit, revisions, "2026-09-10").target_count, 5);
  const stats = getHabitStats(habit, [
    log(1, "2026-09-08", 2), log(2, "2026-09-09", 2),
    log(3, "2026-09-10", 5), log(4, "2026-09-14", 5),
  ], revisions, "2026-09-14");
  assert.equal(stats.completedDays, 4);
  assert.equal(stats.currentStreak, 4);
  assert.equal(stats.consistency, 100);
});

test("paused days are neutral and restore returns to the schedule", () => {
  assert.equal(isScheduledOnDay(habit, revisions, "2026-09-12"), false);
  assert.equal(isScheduledOnDay(habit, revisions, "2026-09-14"), true);
  const stats = getHabitStats(habit, [log(1, "2026-09-08", 2), log(2, "2026-09-09", 2), log(3, "2026-09-10", 5)], revisions, "2026-09-14");
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.due30, 4);
});

test("changing weekdays preserves the schedule before the edit", () => {
  const changed = [
    revisions[0],
    { ...revisions[1], weekdays: 1 << 1 },
  ];
  assert.equal(isScheduledOnDay(habit, changed, "2026-09-09"), true);
  assert.equal(isScheduledOnDay(habit, changed, "2026-09-10"), false);
  assert.equal(isScheduledOnDay(habit, changed, "2026-09-14"), true);
});

test("a skipped scheduled day does not break the streak or lower consistency", () => {
  const alwaysOn = revisions.slice(0, 1);
  const stats = getHabitStats(habit, [log(1, "2026-09-08", 2), log(2, "2026-09-09", 0, 1), log(3, "2026-09-10", 2)], alwaysOn, "2026-09-10");
  assert.equal(stats.currentStreak, 2);
  assert.equal(stats.due30, 2);
  assert.equal(stats.consistency, 100);
});

test("backup validation rejects missing rules and duplicate records", () => {
  const backup = { version: 1, exported_at: "2026-09-14T00:00:00.000Z", habits: [habit], logs: [log(1, "2026-09-08", 2)], revisions };
  assert.equal(parseHabitBackup(JSON.stringify(backup)).habits.length, 1);
  assert.throws(() => parseHabitBackup(JSON.stringify({ ...backup, revisions: [] })), /missing schedule/);
  assert.throws(() => parseHabitBackup(JSON.stringify({ ...backup, logs: [backup.logs[0], backup.logs[0]] })), /duplicate|invalid progress/);
  assert.throws(() => parseHabitBackup(JSON.stringify({ ...backup, habits: [{ ...habit, color: "not-a-color" }] })), /invalid habit/);
  assert.throws(() => parseHabitBackup(JSON.stringify({ ...backup, habits: [{ ...habit, archived: 1 }] })), /inconsistent pause/);
  assert.throws(() => parseHabitBackup("not JSON"), /valid JSON/);
});
