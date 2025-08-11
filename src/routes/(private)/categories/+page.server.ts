import { categoryTypes } from "$lib/constants";
import { category } from "$lib/server/db/schema";
import type { CategoryType } from "$lib/server/db/types";
import type { PageServerLoad, Actions } from "./$types";
import { eq } from "drizzle-orm"

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db
  const categories = await db.select().from(category).orderBy(category.name)
  categories.sort((a, b) => categoryTypes.indexOf(a.type) - categoryTypes.indexOf(b.type)) // Sort by order defined in categoryTypes
  return { categories }
}

export const actions = {
  "createSingle": async ({ request, locals }) => {
    const form = await request.formData()
    const categoryName = form.get('categoryName') as string
    const categoryType = form.get('categoryType') as CategoryType
    const db = locals.db
    await db.insert(category).values({ name: categoryName, type: categoryType })
  },
  "createBulk": async (e) => {

  },
  "edit": async ({ request, locals }) => {
    const db = locals.db
    const form = await request.formData()
    const categoryId = Number(form.get('categoryId'))
    const { categoryName, categoryType } = Object.fromEntries(form)
    await db
      .update(category)
      .set({ name: String(categoryName), type: categoryType as 'sponsor' | 'inhouse' | 'general' })
      .where(eq(category.id, categoryId))
  },
  "delete": async ({ request, locals }) => {
    const db = locals.db
    const form = await request.formData()
    const categoryId = form.get('categoryId') as string
    await db.delete(category).where(eq(category.id, Number(categoryId)))
  },

} satisfies Actions
