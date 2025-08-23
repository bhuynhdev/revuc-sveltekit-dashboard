import { getRequestEvent, query } from '$app/server';
import { judge, judgeGroup } from '$lib/server/db/schema';

export const listJudges = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const judges = await db.query.judge.findMany({ with: { category: true }, orderBy: judge.categoryId })
  return judges
})

export const listJudgeGroups = query(async () => {
  const { locals: { db } } = getRequestEvent()
	const judgeGroups = await db.query.judgeGroup.findMany({ orderBy: [judgeGroup.categoryId, judgeGroup.name], with: { judges: true, category: true } })
  return judgeGroups
})

