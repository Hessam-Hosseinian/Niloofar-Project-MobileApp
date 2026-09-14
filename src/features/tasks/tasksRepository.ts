import { getDatabase } from "@/src/db/database";

export type TaskPriority = "low" | "normal" | "high" | "urgent";

export type Task = {
  id: number;

  title: string;
  notes: string | null;

  due_at: string | null;

  priority: TaskPriority;

  completed: number;

  created_at: string;
  updated_at: string;
};

export async function getTasks() {
  const db = await getDatabase();

  return db.getAllAsync<Task>(`
    SELECT *
    FROM tasks

    ORDER BY
      completed ASC,
      CASE
        WHEN due_at IS NULL THEN 1
        ELSE 0
      END,
      due_at ASC,
      created_at DESC
  `);
}

export async function addTask(title: string) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  await db.runAsync(
    `
    INSERT INTO tasks (
      title,
      created_at,
      updated_at
    )
    VALUES (?, ?, ?)
    `,
    title,
    now,
    now,
  );
}

export async function toggleTask(id: number, completed: boolean) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE tasks

    SET
      completed = ?,
      updated_at = ?

    WHERE id = ?
    `,
    completed ? 1 : 0,
    new Date().toISOString(),
    id,
  );
}

export async function deleteTask(id: number) {
  const db = await getDatabase();

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
    priority: TaskPriority;
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
      priority = ?,
      updated_at = ?

    WHERE id = ?
    `,
    input.title,
    input.notes ?? null,
    input.dueAt ?? null,
    input.priority,
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
