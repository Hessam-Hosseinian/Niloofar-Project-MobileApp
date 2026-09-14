import { getDatabase } from "@/src/db/database";

export type Subtask = {
  id: number;
  task_id: number;
  title: string;
  completed: number;
  created_at: string;
};

export async function getSubtasks(taskId: number) {
  const db = await getDatabase();

  return db.getAllAsync<Subtask>(
    `
    SELECT *
    FROM subtasks
    WHERE task_id = ?
    ORDER BY completed ASC, id ASC
    `,
    taskId,
  );
}

export async function addSubtask(taskId: number, title: string) {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO subtasks (
      task_id,
      title,
      created_at
    )
    VALUES (?, ?, ?)
    `,
    taskId,
    title,
    new Date().toISOString(),
  );
}

export async function toggleSubtask(id: number, completed: boolean) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE subtasks
    SET completed = ?
    WHERE id = ?
    `,
    completed ? 1 : 0,
    id,
  );
}

export async function deleteSubtask(id: number) {
  const db = await getDatabase();

  await db.runAsync(
    `
    DELETE FROM subtasks
    WHERE id = ?
    `,
    id,
  );
}
