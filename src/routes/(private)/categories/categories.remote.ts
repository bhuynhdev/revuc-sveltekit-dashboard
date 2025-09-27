import { form, getRequestEvent, query } from "$app/server";
import { categoryTypes } from "$lib/constants";
import { category } from "$lib/server/db/schema";
import type { CategoryType } from "$lib/server/db/types";
import type { RawDevPostProject } from "$lib/server/devPostParsing";
import { parse } from "csv-parse/sync";
import { eq } from "drizzle-orm";
import * as v from "valibot";

export const listCategories = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const categories = await db.select().from(category).orderBy(category.name)
  categories.sort((a, b) => categoryTypes.indexOf(a.type) - categoryTypes.indexOf(b.type)) // Sort by order defined in categoryTypes
  return categories
})

export const createCategory = form(
  v.object({
    categoryName: v.string(),
    categoryType: v.picklist(categoryTypes)
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { categoryName, categoryType } = form

    await db.insert(category).values({ name: categoryName, type: categoryType }).onConflictDoUpdate({ target: category.name, set: { type: categoryType } })
    await listCategories().refresh()
  })

export const createCategoriesBulk = form(
  v.object({
    csvText: v.string(),
    devPostProjectsFile: v.file()
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { devPostProjectsFile, csvText } = form
    if (devPostProjectsFile.size === 0 && !csvText) {
      throw new Error('Please provide either File or Text input')
    }
    if (devPostProjectsFile.size > 0 && csvText) {
      throw new Error('Please provide only one of File or Text input')
    }
    if (csvText) {
      const categoriesInput: Array<{ name: string; type: 'sponsor' | 'inhouse' }> = parse(csvText, {
        columns: ['name', 'type'],
        skip_empty_lines: true
      })
      await db.insert(category).values(categoriesInput).onConflictDoNothing()
    } else {
      const csvContent = await devPostProjectsFile.text()
      const projectsInput: Array<RawDevPostProject> = parse(csvContent, {
        relaxColumnCount: true,
        skipEmptyLines: true,
        columns: true
      })
      const extractedCategories = Array.from(new Set(projectsInput.flatMap((p) => p['Opt-In Prizes'].split(',').map((c) => c.trim())))).filter(Boolean)
      await db
        .insert(category)
        .values(extractedCategories.map((c) => ({ name: c, type: c.includes('Sponsor') ? ('sponsor' as const) : ('inhouse' as const) }))) // Since we can't know category type from DevPost, default to 'inhouse'
        .onConflictDoNothing()
    }
    await listCategories().refresh()
  })

export const updateCategory = form(
  v.object({
    categoryId: v.string(),
    categoryName: v.string(),
    categoryType: v.picklist(categoryTypes)
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { categoryId, categoryName, categoryType } = form
    await db
      .update(category)
      .set({ name: String(categoryName), type: categoryType as CategoryType })
      .where(eq(category.id, Number(categoryId)))
    await listCategories().refresh()
  })

export const deleteCategory = form(
  v.object({ categoryId: v.string() }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    await db.delete(category).where(eq(category.id, Number(form.categoryId)))
    await listCategories().refresh()
  })
