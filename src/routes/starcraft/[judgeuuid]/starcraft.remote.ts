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

export const updateEvaluation = form(async (form) => {
  const { locals: { db } } = getRequestEvent();

  const score1 = Number(form.get('score1'))
  const score2 = Number(form.get('score2'))
  const score3 = Number(form.get('score3'))
  const submissionId = Number(form.get('submissionId'))
  const judgeId = Number(form.get('judgeId'))

  await db.update(evaluation).set({ score1, score2, score3 }).where(and(eq(evaluation.judgeId, judgeId), eq(evaluation.submissionId, submissionId)))
  await getJudgeByUuid(String(form.get('judgeUuid'))).refresh()
})
