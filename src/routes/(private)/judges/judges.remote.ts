import { form, getRequestEvent, query } from '$app/server';
import { judge } from '$lib/server/db/schema';
import { parse } from 'csv-parse/sync';
import { eq, sql } from 'drizzle-orm';

export const listJudges = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const judges = await db.query.judge.findMany({ with: { category: true }, orderBy: judge.categoryId })
  return judges
})

export const createJudge = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const judgeName = form.get('name') as string
  const email = form.get('email') as string
  const categoryId = form.get('categoryId') as string
  await db.insert(judge).values({ name: judgeName, email, categoryId: Number(categoryId) })
  await listJudges().refresh()
})

export const createJudgesBulk = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const csvFile = form.get('csvFile') as File
  const csvText = form.get('csvText') as string

  if (csvFile.size === 0 && !csvText) {
    throw new Error('Please provide either File or Text input')
  }
  if (csvFile.size > 0 && csvText) {
    throw new Error('Please provide only one of File or Text input')
  }

  const csvContent = csvText || (await csvFile.text())
  const judgesParseResult: Array<{ name: string; email: string; categoryId?: number }> = parse(csvContent, {
    columns: ['name', 'email', 'categoryId'],
    skip_empty_lines: true,
    relaxColumnCountLess: true, // Allow not passing categoryId field
    cast: (value, context) => (context.column === 'categoryId' ? Number(value) : String(value))
  })

  const judgesInput = judgesParseResult.map(j => ({ categoryId: j.categoryId || 1, ...j }))

  // Split into batch because Cloudflare D1 has limit on SQL statement size
  const BATCH_SIZE = 30;
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
})

export const updateJudge = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const judgeId = form.get('judgeId') as string
  const { name, email, categoryId } = Object.fromEntries(form)

  await db
    .update(judge)
    .set({
      name: String(name),
      email: String(email),
      categoryId: Number(categoryId)
    })
    .where(eq(judge.id, Number(judgeId)))
  await listJudges().refresh()
})

export const deleteJudge = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const judgeId = form.get('judgeId') as string
  await db.delete(judge).where(eq(judge.id, Number(judgeId)))
  await listJudges().refresh()
})
