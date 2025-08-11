import { categoryTypes } from "$lib/constants";
import { category } from "$lib/server/db/schema";
import type { CategoryType } from "$lib/server/db/types";
import { parseDevPostProjectsCsv } from "$lib/server/devPostParsing";
import { parse } from 'csv-parse/sync';
import { eq } from "drizzle-orm";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db
  const categories = await db.select().from(category).orderBy(category.name)
  categories.sort((a, b) => categoryTypes.indexOf(a.type) - categoryTypes.indexOf(b.type)) // Sort by order defined in categoryTypes
  return { categories }
}

export const actions = {
  "createSingle": async ({ request, locals: { db } }) => {
    const form = await request.formData()
    const categoryName = form.get('categoryName') as string
    const categoryType = form.get('categoryType') as CategoryType
    await db.insert(category).values({ name: categoryName, type: categoryType })
  },
  "createBulk": async ({ request, locals: { db } }) => {
    const form = await request.formData()
    const devPostProjectsFile = form.get('devPostProjectsFile') as File
    const csvText = form.get('csvText') as string
    if (devPostProjectsFile.size === 0 && !csvText) {
      throw new Error('Please provide either File or Text input')
    }
    if (devPostProjectsFile.size > 0 && csvText) {
      throw new Error('Please provide only one of File or Text input')
    }
    if (csvText) {
      // This is our custom categories bulk-entry form: the CSV only has columns `name` and `type`
      const categoriesInput: Array<{ name: string; type: 'sponsor' | 'inhouse' }> = parse(csvText, {
        columns: ['name', 'type'],
        skip_empty_lines: true
      })
      await db.insert(category).values(categoriesInput).onConflictDoNothing()
    } else {
      const csvContent = await devPostProjectsFile.text()
      const devPostProjects = parseDevPostProjectsCsv(csvContent)
      const extractedCategories = Array.from(new Set(devPostProjects.flatMap((p) => p.categoriesCsv.split(',').map((c) => c.trim())))).filter(Boolean)
      await db
        .insert(category)
        // Since we can't know category type from DevPost, try to guess & default to 'inhouse'
        .values(extractedCategories.map((c) => ({ name: c, type: c.includes('Sponsor') ? ('sponsor' as const) : ('inhouse' as const) })))
        .onConflictDoNothing()
    }
  },
  "edit": async ({ request, locals: { db } }) => {
    const form = await request.formData()
    const categoryId = Number(form.get('categoryId'))
    const { categoryName, categoryType } = Object.fromEntries(form)
    await db
      .update(category)
      .set({ name: String(categoryName), type: categoryType as 'sponsor' | 'inhouse' | 'general' })
      .where(eq(category.id, categoryId))
  },
  "delete": async ({ request, locals: { db } }) => {
    const form = await request.formData()
    const categoryId = form.get('categoryId') as string
    await db.delete(category).where(eq(category.id, Number(categoryId)))
  },
} satisfies Actions
