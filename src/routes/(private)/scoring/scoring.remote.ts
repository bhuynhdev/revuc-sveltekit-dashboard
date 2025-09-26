import { form, getRequestEvent, query } from "$app/server";
import { evaluation } from "$lib/server/db/schema";
import type { NewEvaluation } from "$lib/server/db/types";

export const listEvaluations = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const evaluations = await db.query.evaluation.findMany({ with: { submission: { with: { project: true } } } })
  return evaluations
})

/**
 * Create evaluations records
 */
export const startEvaluations = form(async () => {
  const { locals: { db } } = getRequestEvent()
  const assignments = await db.query.assignment.findMany({ with: { judgeGroup: { with: { judges: true } } } })
  const evaluationsToInsert: NewEvaluation[] = assignments.flatMap(a => {
    return a.judgeGroup.judges.map(j => ({ submissionId: a.submissionId, judgeId: j.id }))
  })

  // Split into batch because Cloudflare D1 has limit on SQL statement size
  const BATCH_SIZE = 10;
  for (let i = 0; i < evaluationsToInsert.length; i += BATCH_SIZE) {
    const batch = evaluationsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(evaluation).values(batch);
  }

  await listEvaluations().refresh()
})

