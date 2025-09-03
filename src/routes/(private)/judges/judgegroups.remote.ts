import { form, getRequestEvent, query } from '$app/server';
import { judge, judgeGroup } from '$lib/server/db/schema';
import type { Judge } from '$lib/server/db/types';
import { eq, inArray } from 'drizzle-orm';

export const listJudgeGroups = query(async () => {
  const { locals: { db } } = getRequestEvent()
	const judgeGroups = await db.query.judgeGroup.findMany({ orderBy: [judgeGroup.categoryId, judgeGroup.name], with: { judges: true, category: true } })
  return judgeGroups
})

export const createJudgeGroup = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
	const categoryId = Number(form.get('categoryId'))
	const name = form.get('name') as string
	await db.insert(judgeGroup).values({ categoryId, name })
	await listJudgeGroups().refresh()
})

export const clearJudgeGroups = form(async () => {
  const { locals: { db } } = getRequestEvent()
	await db.delete(judgeGroup)
  await listJudgeGroups().refresh()
})

export const deleteEmptyJudgeGroup = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
	const groupId = Number(form.get('groupId'))
	const memberCount = await db.$count(judge, eq(judge.judgeGroupId, groupId))
	if (memberCount > 0) {
		throw Error('Group must be empty to be manually deleted.')
	}
	await db.delete(judgeGroup).where(eq(judgeGroup.id, groupId))
  await listJudgeGroups().refresh()
})

export const resetAndOrganizeJudgeGroups = form(async () => {
  const { locals: { db } } = getRequestEvent()
	const allJudges = await db.query.judge.findMany({ with: { category: true } })
	const judgesByCategories = allJudges.reduce(
		(acc, judge) => {
			const categoryId = judge.categoryId
			if (!acc.has(categoryId)) {
				acc.set(categoryId, [])
			}
			acc.get(categoryId)!.push(judge)
			return acc
		},
		new Map() as Map<Judge['categoryId'], Array<(typeof allJudges)[number]>>
	)

	// Judge group organization logic: If they are in a sponsor category, put these judges into one group
	// Else, split off into groups of 2
	const judgeGroups = []
	for (const [categoryId, judgesOfThisCategory] of judgesByCategories) {
		const category = judgesOfThisCategory[0].category
		if (category.type === 'sponsor') {
			judgeGroups.push({ categoryId, members: judgesOfThisCategory, name: String.fromCharCode(categoryId + 64) })
		} else {
			// Chunk into groups of two
			for (let i = 0; i < judgesOfThisCategory.length; i += 2) {
				judgeGroups.push({ categoryId, members: judgesOfThisCategory.slice(i, i + 2), name: '' })
			}
		}
	}

	const judgeGroupCountByCategory: Record<number, number> = {}

	// Assign a two-character name to each group following this convention:
	// - First char is categoryId converted to ASCII (1 -> A, 2 -> B, etc.)
	// - Second char is the ordering of this group within the category (1st group of cateogyId 1 -> A1, etc.)
	for (const group of judgeGroups) {
		const count = (judgeGroupCountByCategory[group.categoryId] || 0) + 1
		judgeGroupCountByCategory[group.categoryId] = count

		const firstChar = String.fromCharCode(64 + group.categoryId)
		const secondChar = count.toString()

		group.name = `${firstChar}${secondChar}`
	}

	await db.delete(judgeGroup)
	for (const g of judgeGroups) {
		const [{ id: createdGroupId }] = await db.insert(judgeGroup).values(g).returning({ id: judgeGroup.id })
		const judgeIds = g.members.map((j) => j.id)
		await db.update(judge).set({ judgeGroupId: createdGroupId }).where(inArray(judge.id, judgeIds))
	}
})


