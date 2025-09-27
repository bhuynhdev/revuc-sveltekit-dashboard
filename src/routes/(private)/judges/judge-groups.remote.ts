import { form, getRequestEvent, query } from '$app/server';
import { judge, judgeGroup } from '$lib/server/db/schema';
import type { Judge } from '$lib/server/db/types';
import { eq, inArray } from 'drizzle-orm';
import * as v from 'valibot';

export const listJudgeGroups = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const judgeGroups = await db.query.judgeGroup.findMany({ orderBy: [judgeGroup.categoryId, judgeGroup.name], with: { judges: true, category: true } })
  return judgeGroups
})

export const createJudgeGroup = form(
  v.object({
    categoryId: v.pipe(v.string(), v.transform(Number), v.number()),
    name: v.string(),
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { categoryId, name } = form
    await db.insert(judgeGroup).values({ categoryId: categoryId, name })
    await listJudgeGroups().refresh()
  }
)

export const clearJudgeGroups = form(async () => {
  const { locals: { db } } = getRequestEvent()
  await db.delete(judgeGroup)
  await listJudgeGroups().refresh()
})

export const deleteEmptyJudgeGroup = form(
  v.object({
    groupId: v.pipe(v.string(), v.transform(Number), v.number())
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const memberCount = await db.$count(judge, eq(judge.judgeGroupId, form.groupId))
    if (memberCount > 0) {
      throw Error('Group must be empty to be manually deleted.')
    }
    await db.delete(judgeGroup).where(eq(judgeGroup.id, form.groupId))
    await listJudgeGroups().refresh()
  }
)

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

  await listJudgeGroups().refresh()
})

export const moveJudge = form(v.object({
  judgeId: v.pipe(v.string(), v.transform(Number), v.number()),
  newGroupId: v.pipe(v.string(), v.transform(Number), v.number())
}), async (form) => {
  const { locals: { db } } = getRequestEvent()
  const { judgeId, newGroupId } = form
  const [judgeToMove] = await db.select().from(judge).where(eq(judge.id, judgeId))
  const [newGroup] = await db.select().from(judgeGroup).where(eq(judgeGroup.id, newGroupId))
  if (judgeToMove.categoryId !== newGroup.categoryId) {
    throw Error(`Judge ${judgeId} of category ${judgeToMove.categoryId} cannot move to group of category ${newGroup.categoryId}`)
  }

  await db.update(judge).set({ judgeGroupId: newGroupId }).where(eq(judge.id, judgeId))
  await listJudgeGroups().refresh()
})
