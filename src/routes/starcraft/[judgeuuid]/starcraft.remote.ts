import { form, getRequestEvent, query } from "$app/server";
import { assignment, evaluation, judge } from "$lib/server/db/schema";
import type { Evaluation } from "$lib/server/db/types";
import { and, eq, inArray } from "drizzle-orm";
import * as v from 'valibot';

export const getJudgeAssignmentsByUuid = query(v.string(), async (uuid) => {
  const { locals: { db } } = getRequestEvent();

  const judgeRecord = await db.query.judge.findFirst({
    where: eq(judge.uuid, uuid),
    with: { category: true, group: true },
  });

  if (!judgeRecord) {
    throw new Error("Judge not found");
  }
  if (!judgeRecord.judgeGroupId) {
    // No groups nor assignments yet
    return { ...judgeRecord, assignedSubmissions: [] }
  }

  const assignments = await db.query.assignment.findMany({
    where: eq(assignment.judgeGroupId, judgeRecord.judgeGroupId),
    columns: { submissionId: true },
    with: { submission: { with: { project: true } } },
  })

  return { ...judgeRecord, assignedSubmissions: assignments.map(a => a.submission) };
});

export const getEvaluations = query(
  v.string(),
  async (uuid) => {
    const { locals: { db } } = getRequestEvent()
    const [ judgeRecord ] = await db.select().from(judge).where(eq(judge.uuid, uuid))
    const assignments = await db.select().from(assignment).where(eq(assignment.judgeGroupId, Number(judgeRecord.judgeGroupId)))
    const evaluations = await db.select().from(evaluation).where(inArray(evaluation.submissionId, assignments.map(a => a.submissionId)))
    // Convert to object form: { [submissionId]: Evaluation[] }
    const evaluationBySubmissionId = evaluations.reduce((acc, evaluation) => {
      const id = evaluation.submissionId.toString(); // Use string keys for object map
      if (!acc[id]) {
        acc[id] = evaluation;
      }
      return acc;
    }, {} as Record<string, Evaluation>)

    return evaluationBySubmissionId
  }
)

export const updateEvaluation = form(
  v.object({
    judgeUuid: v.string(),
    score1: v.pipe(v.string(), v.transform(Number), v.number()),
    score2: v.pipe(v.string(), v.transform(Number), v.number()),
    score3: v.pipe(v.string(), v.transform(Number), v.number()),
    submissionId: v.pipe(v.string(), v.transform(Number), v.number()),
    judgeId: v.pipe(v.string(), v.transform(Number), v.number()),
    categoryScore: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent();
    const { score1, score2, score3, submissionId, judgeId, judgeUuid, categoryScore } = form
    await db.update(evaluation).set({ score1, score2, score3, categoryScore }).where(and(eq(evaluation.judgeId, judgeId), eq(evaluation.submissionId, submissionId)))
    await getEvaluations(judgeUuid).refresh()
  }
)
