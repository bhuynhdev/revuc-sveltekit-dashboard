import { form, getRequestEvent, query } from '$app/server';
import { category, judge } from '$lib/server/db/schema';
import { parse } from 'csv-parse/sync';
import { eq, sql } from 'drizzle-orm';
import * as v from 'valibot'

export const listJudges = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const judges = await db.query.judge.findMany({ with: { category: true }, orderBy: judge.categoryId })
  return judges
})

export const createJudge = form(
  v.object({
    name: v.string(),
    email: v.pipe(v.string(), v.email()),
    categoryId: v.pipe(v.string(), v.transform(Number), v.number())
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { name, email, categoryId } = form
    await db.insert(judge).values({ name, email, categoryId })
    await listJudges().refresh()
  }
)

export const createJudgesBulk = form(
  v.object({
    csvFile: v.optional(v.pipe(v.file(), v.notSize(0))),
    csvText: v.optional(v.string(), ""),
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { csvFile, csvText } = form

    if (!csvText && !csvFile) {
      throw new Error('Please provide either File or Text input')
    }

    if (csvFile && csvText) {
      throw new Error('Please provide only one of File or Text input')
    }

    const csvContent = csvFile ? await csvFile.text() : csvText
    const judgesParseResult: Array<{ name: string; email: string; categoryName?: string }> = parse(csvContent, {
      columns: ['name', 'email', 'categoryName'],
      skip_empty_lines: true,
      relaxColumnCountLess: true, // Allow not passing categoryId field
      // cast: (value, context) => (context.column === 'categoryId' ? Number(value) : String(value))
    })

    const allCategories = await db.select({ id: category.id, name: category.name }).from(category)
    const categoryNameToIdMap = new Map(allCategories.map(c => [c.name, c.id]));

    const judgesInput = judgesParseResult.map(j => ({ categoryId: categoryNameToIdMap.get(j.categoryName || 'General') || 1, ...j }))

    // Split into batch because Cloudflare D1 has limit on SQL statement size
    const BATCH_SIZE = 15;
    for (let i = 0; i < judgesInput.length; i += BATCH_SIZE) {
      const batch = judgesInput.slice(i, i + BATCH_SIZE);
      await db.insert(judge).values(batch).onConflictDoUpdate({
        target: judge.email,
        set: {
          name: sql.raw(`excluded.${judge.name.name}`),
          categoryId: sql.raw(`excluded.${judge.categoryId.name}`)
        }
      });
    }

    await listJudges().refresh()
  }
)

export const updateJudge = form(
  v.object({
    judgeId: v.pipe(v.string(), v.transform(Number), v.number()),
    name: v.string(),
    email: v.pipe(v.string(), v.email()),
    categoryId: v.pipe(v.string(), v.transform(Number), v.number()),
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { judgeId, name, email, categoryId } = form

    await db
      .update(judge)
      .set({ name, email, categoryId })
      .where(eq(judge.id, judgeId))
    await listJudges().refresh()
  })

export const deleteJudge = form(
  v.object({
    judgeId: v.pipe(v.string(), v.transform(Number), v.number())
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    await db.delete(judge).where(eq(judge.id, form.judgeId))
    await listJudges().refresh()
  }
)
