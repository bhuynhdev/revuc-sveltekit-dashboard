import { form, getRequestEvent } from "$app/server";
import { evaluation } from "$lib/server/db/schema";
import { sql } from "drizzle-orm";

export const randomizeEvaluationScores = form(async () => {
  const { locals: { db } } = getRequestEvent()
  await db
    .update(evaluation)
    .set({
      score1: sql`ABS(RANDOM() % 5) + 1`, // 1–5
      score2: sql`ABS(RANDOM() % 5) + 1`, // 1–5
      score3: sql`ABS(RANDOM() % 5) + 1` // 1–5
    });
})
