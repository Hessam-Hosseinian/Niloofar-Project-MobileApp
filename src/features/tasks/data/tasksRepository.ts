import { getDatabase } from "@/src/db/database";
import { getNextDueDate } from "./taskRecurrence";
import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "@/src/features/tasks/notifications";

export type TaskPriority = "low" | "normal" | "high" | "urgent";
export type RepeatType = "none" | "daily" | "weekly" | "monthly";

export type Task = {
  id: number;

  title: string;
  notes: string | null;

  due_at: string | null;
  planned_day: string | null;

  priority: TaskPriority;

  repeat_type: RepeatType;
  repeat_interval: number;

  reminder_minutes: number | null;
  notification_id: string | null;

  next_occurrence_created: number;
  completed: number;

  subtask_total?: number;
  subtask_completed?: number;

  created_at: string;
  updated_at: string;
};

export async function getTasks() {
  const db = await getDatabase();

  return db.getAllAsync<Task>(`
    SELECT
      tasks.*,
      COUNT(subtasks.id) AS subtask_total,
      COALESCE(
        SUM(CASE WHEN subtasks.completed = 1 THEN 1 ELSE 0 END),
        0
      ) AS subtask_completed
    FROM tasks
    LEFT JOIN subtasks ON subtasks.task_id = tasks.id
    GROUP BY tasks.id

    ORDER BY
      tasks.completed ASC,
      CASE
        WHEN tasks.due_at IS NULL THEN 1
        ELSE 0
      END,
      tasks.due_at ASC,
      tasks.created_at DESC
  `);
}

export async function addTask(
  title: string,
  options: { plannedDay?: string | null; priority?: TaskPriority } = {},
) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO tasks (
      title,
      planned_day,
      priority,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    title,
    options.plannedDay ?? null,
    options.priority ?? "normal",
    now,
    now,
  );
}

export async function setTaskPlannedDay(id: number, plannedDay: string | null) {
  const db = await getDatabase();
  await db.runAsync(
    "UPDATE tasks SET planned_day = ?, updated_at = ? WHERE id = ?",
    plannedDay,
    new Date().toISOString(),
    id,
  );
}

export async function toggleTask(id: number, completed: boolean) {
  const db = await getDatabase();

  const outcome: {
    changedTask?: Task;
    nextReminder?: {
      taskId: number;
      title: string;
      dueAt: string;
      reminderMinutes: number;
    };
  } = {};

  await db.withExclusiveTransactionAsync(async (transaction) => {
    const task = await transaction.getFirstAsync<Task>(
      `
      SELECT *
      FROM tasks
      WHERE id = ?
      LIMIT 1
      `,
      id,
    );

    if (!task) {
      return;
    }

    outcome.changedTask = task;

    const now = new Date().toISOString();

    await transaction.runAsync(
      `
      UPDATE tasks
      SET
        completed = ?,
        notification_id = CASE WHEN ? = 1 THEN NULL ELSE notification_id END,
        updated_at = ?
      WHERE id = ?
      `,
      completed ? 1 : 0,
      completed ? 1 : 0,
      now,
      id,
    );

    if (
      !completed ||
      task.repeat_type === "none" ||
      task.next_occurrence_created
    ) {
      return;
    }

    const nextDueAt = getNextDueDate(
      task.due_at,
      task.repeat_type,
      task.repeat_interval,
    );

    const insertResult = await transaction.runAsync(
      `
      INSERT INTO tasks (
        title,
        notes,
        due_at,
        planned_day,
        priority,
        repeat_type,
        repeat_interval,
        reminder_minutes,
        completed,
        next_occurrence_created,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
      `,
      task.title,
      task.notes,
      nextDueAt,
      null,
      task.priority,
      task.repeat_type,
      normalizeRepeatInterval(task.repeat_interval),
      task.reminder_minutes,
      now,
      now,
    );

    await transaction.runAsync(
      `INSERT INTO subtasks (task_id, title, completed, created_at)
       SELECT ?, title, 0, ? FROM subtasks WHERE task_id = ? ORDER BY id`,
      Number(insertResult.lastInsertRowId),
      now,
      id,
    );

    await transaction.runAsync(
      `
      UPDATE tasks
      SET
        next_occurrence_created = 1,
        updated_at = ?
      WHERE id = ?
      `,
      now,
      id,
    );

    if (task.reminder_minutes !== null) {
      outcome.nextReminder = {
        taskId: Number(insertResult.lastInsertRowId),
        title: task.title,
        dueAt: nextDueAt,
        reminderMinutes: task.reminder_minutes,
      };
    }
  });

  const { changedTask, nextReminder } = outcome;

  if (!changedTask) {
    return;
  }

  if (completed) {
    await cancelTaskReminder(changedTask.notification_id);
  } else if (
    !changedTask.notification_id &&
    changedTask.due_at &&
    changedTask.reminder_minutes !== null
  ) {
    const notificationId = await scheduleTaskReminder(
      changedTask.title,
      changedTask.due_at,
      changedTask.reminder_minutes,
    );

    await updateNotificationId(id, notificationId);
  }

  if (nextReminder) {
    const notificationId = await scheduleTaskReminder(
      nextReminder.title,
      nextReminder.dueAt,
      nextReminder.reminderMinutes,
    );

    await updateNotificationId(nextReminder.taskId, notificationId);
  }
}

export async function deleteTask(id: number) {
  const db = await getDatabase();

  const task = await db.getFirstAsync<Pick<Task, "notification_id">>(
    `SELECT notification_id FROM tasks WHERE id = ? LIMIT 1`,
    id,
  );

  await cancelTaskReminder(task?.notification_id);

  await db.runAsync(
    `
    DELETE FROM tasks
    WHERE id = ?
    `,
    id,
  );
}
export async function updateTask(
  id: number,
  input: {
    title: string;
    notes?: string | null;
    dueAt?: string | null;
    plannedDay?: string | null;
    priority: TaskPriority;
    repeatType: RepeatType;
    repeatInterval: number;
    reminderMinutes?: number | null;
    notificationId?: string | null;
  },
) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE tasks

    SET
      title = ?,
      notes = ?,
      due_at = ?,
      planned_day = ?,
      priority = ?,
      repeat_type = ?,
      repeat_interval = ?,
      reminder_minutes = ?,
      notification_id = ?,
      updated_at = ?

    WHERE id = ?
    `,
    input.title,
    input.notes ?? null,
    input.dueAt ?? null,
    input.plannedDay ?? null,
    input.priority,
    input.repeatType,
    normalizeRepeatInterval(input.repeatInterval),
    input.reminderMinutes ?? null,
    input.notificationId ?? null,
    new Date().toISOString(),
    id,
  );
}
export async function getTaskById(id: number) {
  const db = await getDatabase();

  return db.getFirstAsync<Task>(
    `
    SELECT *
    FROM tasks
    WHERE id = ?
    LIMIT 1
    `,
    id,
  );
}

function normalizeRepeatInterval(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.floor(value));
}

async function updateNotificationId(id: number, notificationId: string | null) {
  const db = await getDatabase();

  await db.runAsync(
    `UPDATE tasks SET notification_id = ?, updated_at = ? WHERE id = ?`,
    notificationId,
    new Date().toISOString(),
    id,
  );
}
