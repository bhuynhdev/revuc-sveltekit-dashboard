import { categoryTypes } from "$lib/constants";
import { category } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  const db = locals.db
  const categories = await db.select().from(category).orderBy(category.name)
  categories.sort((a, b) => categoryTypes.indexOf(a.type) - categoryTypes.indexOf(b.type)) // Sort by order defined in categoryTypes
  return { categories }
}
