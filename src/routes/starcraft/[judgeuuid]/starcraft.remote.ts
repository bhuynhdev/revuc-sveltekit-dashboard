import { form, getRequestEvent, query } from "$app/server";
import { assignment, evaluation, judge } from "$lib/server/db/schema";
import { and, eq } from "drizzle-orm";
import * as v from 'valibot';

export const getJudgeByUuid = query(v.string(), async (uuid) => {
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
    with: {
      submission: {
        with: {
          project: true, evaluations: {
            where: eq(evaluation.judgeId, judgeRecord.id)
          }
        },
      },
    },
  });

  const assignedSubmissions = assignments.map(({ submission }) => {
    const { evaluations, ...rest } = submission;
    return { ...rest, evaluation: evaluations[0] };
  });

  return { ...judgeRecord, assignedSubmissions };
});

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
    await getJudgeByUuid(judgeUuid).refresh()
  }
)
