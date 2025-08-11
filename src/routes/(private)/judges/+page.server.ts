import { category, judge, judgeGroup } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  // Load judges, judgeGroups, and categories
  const db = locals.db
	const judgeGroups = await db.query.judgeGroup.findMany({ orderBy: [judgeGroup.categoryId, judgeGroup.name], with: { judges: true, category: true } })
	const judges = await db.query.judge.findMany({ with: { category: true }, orderBy: judge.categoryId })
	const categories = await db.select().from(category).orderBy(category.name)

  return { judges, judgeGroups, categories }
}
