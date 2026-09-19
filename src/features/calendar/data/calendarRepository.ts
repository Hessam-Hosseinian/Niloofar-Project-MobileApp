import { getDatabase } from "@/src/db/database";

export type CalendarEvent = {
  id: number;

  title: string;
  description: string | null;

  starts_at: string;
  ends_at: string | null;

  all_day: number;

  reminder_minutes: number | null;
  notification_id: string | null;

  created_at: string;
  updated_at: string;
};

export async function getEventsForRange(start: string, end: string) {
  const db = await getDatabase();

  return db.getAllAsync<CalendarEvent>(
    `
    SELECT *
    FROM calendar_events
    WHERE starts_at < ?
      AND (
        ends_at > ?
        OR (ends_at IS NULL AND starts_at >= ?)
      )
    ORDER BY datetime(starts_at) ASC
    `,
    end,
    start,
    start,
  );
}

export async function getEventById(id: number) {
  const db = await getDatabase();

  return db.getFirstAsync<CalendarEvent>(
    `
    SELECT *
    FROM calendar_events
    WHERE id = ?
    LIMIT 1
    `,
    id,
  );
}

export async function createEvent(input: {
  title: string;
  description?: string | null;

  startsAt: string;
  endsAt?: string | null;

  allDay?: boolean;

  reminderMinutes?: number | null;
  notificationId?: string | null;
}) {
  const db = await getDatabase();

  const now = new Date().toISOString();

  const result = await db.runAsync(
    `
      INSERT INTO calendar_events (
        title,
        description,

        starts_at,
        ends_at,

        all_day,

        reminder_minutes,
        notification_id,

        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    input.title,
    input.description ?? null,

    input.startsAt,
    input.endsAt ?? null,

    input.allDay ? 1 : 0,

    input.reminderMinutes ?? null,
    input.notificationId ?? null,

    now,
    now,
  );

  return Number(result.lastInsertRowId);
}

export async function deleteEvent(id: number) {
  const db = await getDatabase();

  await db.runAsync(
    `
    DELETE FROM calendar_events
    WHERE id = ?
    `,
    id,
  );
}

export type CalendarTask = {
  id: number;
  title: string;

  due_at: string;

  priority: string;
  completed: number;
};
export async function getTasksForRange(start: string, end: string) {
  const db = await getDatabase();

  return db.getAllAsync<CalendarTask>(
    `
    SELECT
      id,
      title,
      due_at,
      priority,
      completed

    FROM tasks

    WHERE
      due_at IS NOT NULL
      AND due_at >= ?
      AND due_at < ?

    ORDER BY datetime(due_at) ASC
    `,
    start,
    end,
  );
}
