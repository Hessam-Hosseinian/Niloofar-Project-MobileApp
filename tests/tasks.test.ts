/// <reference types="node" />
import assert from "node:assert/strict";
import test from "node:test";

import { filterAndSortTasks, getLocalDayKey } from "../src/features/tasks/taskListUtils";
import { getNextDueDate } from "../src/features/tasks/taskRecurrence";
import type { Task } from "../src/features/tasks/tasksRepository";

const now = new Date(2026, 8, 18, 12, 0);
const day = getLocalDayKey(now);
const task = (id: number, overrides: Partial<Task> = {}): Task => ({
  id,
  title: `Task ${id}`,
  notes: null,
  due_at: null,
  planned_day: null,
  priority: "normal",
  repeat_type: "none",
  repeat_interval: 1,
  reminder_minutes: null,
  notification_id: null,
  next_occurrence_created: 0,
  completed: 0,
  created_at: now.toISOString(),
  updated_at: now.toISOString(),
  ...overrides,
});

test("Today includes planned, due and overdue work but not completed work", () => {
  const tasks = [
    task(1, { planned_day: day }),
    task(2, { due_at: new Date(2026, 8, 18, 18).toISOString() }),
    task(3, { due_at: new Date(2026, 8, 17, 18).toISOString() }),
    task(4),
    task(5, { planned_day: day, completed: 1 }),
  ];
  assert.deepEqual(filterAndSortTasks(tasks, "today", "default", now).map((item) => item.id), [3, 1, 2]);
});

test("Important and Upcoming are useful without duplicating completed tasks", () => {
  const tasks = [
    task(1, { priority: "high" }),
    task(2, { priority: "urgent", completed: 1 }),
    task(3, { planned_day: getLocalDayKey(new Date(2026, 8, 19)) }),
  ];
  assert.deepEqual(filterAndSortTasks(tasks, "important", "default", now).map((item) => item.id), [1]);
  assert.deepEqual(filterAndSortTasks(tasks, "upcoming", "default", now).map((item) => item.id), [3]);
});

test("Inbox keeps unplanned tasks and returns unfinished plans from earlier days", () => {
  const tasks = [
    task(1),
    task(2, { planned_day: getLocalDayKey(new Date(2026, 8, 17)) }),
    task(3, { planned_day: day }),
    task(4, { due_at: new Date(2026, 8, 19, 18).toISOString() }),
    task(5, { completed: 1 }),
  ];
  assert.deepEqual(filterAndSortTasks(tasks, "inbox", "default", now).map((item) => item.id), [1, 2]);
});

test("overdue recurring work skips missed occurrences", () => {
  const next = getNextDueDate("2026-09-10T09:00:00.000Z", "daily", 1, new Date("2026-09-18T12:00:00.000Z"));
  assert.equal(next, "2026-09-19T09:00:00.000Z");
});

test("monthly recurrence keeps its original day after a short month", () => {
  const next = getNextDueDate("2026-01-31T09:00:00.000Z", "monthly", 1, new Date("2026-02-28T12:00:00.000Z"));
  assert.equal(next, "2026-03-31T09:00:00.000Z");
});
