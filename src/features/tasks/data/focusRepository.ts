import { getDatabase } from "@/src/db/database";

export type FocusSession = {
  id: number;
  task_id: number;

  started_at: string;
  ended_at: string | null;

  duration_seconds: number;
  completed: number;
};

export async function createFocusSession(taskId: number) {
  const db = await getDatabase();

  const result = await db.runAsync(
    `
    INSERT INTO focus_sessions (
      task_id,
      started_at
    )
    VALUES (?, ?)
    `,
    taskId,
    new Date().toISOString(),
  );

  return Number(result.lastInsertRowId);
}

export async function completeFocusSession(
  sessionId: number,
  durationSeconds: number,
) {
  const db = await getDatabase();

  await db.runAsync(
    `
    UPDATE focus_sessions

    SET
      ended_at = ?,
      duration_seconds = ?,
      completed = 1

    WHERE id = ?
    `,
    new Date().toISOString(),
    durationSeconds,
    sessionId,
  );
}

export async function discardFocusSession(sessionId: number) {
  const db = await getDatabase();
  await db.runAsync(
    "DELETE FROM focus_sessions WHERE id = ? AND completed = 0",
    sessionId,
  );
}

export async function getTaskFocusStats(taskId: number) {
  const db = await getDatabase();

  return db.getFirstAsync<{
    sessions: number;
    total_seconds: number;
  }>(
    `
    SELECT
      COUNT(*) AS sessions,
      COALESCE(
        SUM(duration_seconds),
        0
      ) AS total_seconds

    FROM focus_sessions

    WHERE
      task_id = ?
      AND completed = 1
    `,
    taskId,
  );
  
}

export async function getRecentFocusSessions(
  taskId: number,
  limit = 10
) {
  const db = await getDatabase();

  return db.getAllAsync<FocusSession>(
    `
    SELECT *
    FROM focus_sessions
    WHERE
      task_id = ?
      AND completed = 1
    ORDER BY datetime(started_at) DESC
    LIMIT ?
    `,
    taskId,
    limit
  );
}

export async function getDailyFocusStats(
  taskId: number
) {
  const db = await getDatabase();

  return db.getAllAsync<{
    day: string;
    sessions: number;
    total_seconds: number;
  }>(
    `
    SELECT
      date(started_at, 'localtime') AS day,
      COUNT(*) AS sessions,
      SUM(duration_seconds) AS total_seconds
    FROM focus_sessions
    WHERE
      task_id = ?
      AND completed = 1
    GROUP BY date(started_at, 'localtime')
    ORDER BY day DESC
    LIMIT 30
    `,
    taskId
  );
}
