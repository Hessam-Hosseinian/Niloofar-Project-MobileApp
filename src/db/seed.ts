import type { SQLiteDatabase } from "expo-sqlite";

export async function seedDatabase(db: SQLiteDatabase) {
  const row = await db.getFirstAsync<{
    count: number;
  }>("SELECT COUNT(*) as count FROM activities");

  if ((row?.count ?? 0) > 0) {
    return;
  }

  const now = Date.now();

  const samples = [
    {
      type: "payment",
      title: "Card Payment",
      subtitle: "Coffee Shop",
      amount: -12.5,
    },
    {
      type: "ride",
      title: "Ride Completed",
      subtitle: "Downtown → Home",
      amount: -8.2,
    },
    {
      type: "order",
      title: "Order Delivered",
      subtitle: "Marketplace",
      amount: -32.9,
    },
  ];

  for (let i = 0; i < samples.length; i++) {
    const item = samples[i];

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
      item.type,
      item.title,
      item.subtitle,
      item.amount,
      new Date(now - i * 60 * 60 * 1000).toISOString(),
    );
  }
}
