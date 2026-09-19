import { getDatabase } from "./database";

export type ActivityRecord = {
  id: number;
  type: string;
  title: string;
  subtitle: string | null;
  amount: number | null;
  created_at: string;
};

export async function getActivities() {
  const db = await getDatabase();

  return db.getAllAsync<ActivityRecord>(
    `
    SELECT
      id,
      type,
      title,
      subtitle,
      amount,
      created_at
    FROM activities
    ORDER BY datetime(created_at) DESC
    `,
  );
}

export async function addActivity(input: {
  type: string;
  title: string;
  subtitle?: string;
  amount?: number;
}) {
  const db = await getDatabase();

  await db.runAsync(
    `
    INSERT INTO activities (
      type,
      title,
      subtitle,
      amount,
      created_at
    )
    VALUES (?, ?, ?, ?, ?)
    `,
    input.type,
    input.title,
    input.subtitle ?? null,
    input.amount ?? null,
    new Date().toISOString(),
  );
}

export async function clearActivities() {
  const db = await getDatabase();

  await db.runAsync("DELETE FROM activities");
}
