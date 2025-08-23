import { getRequestEvent, query } from "$app/server";
import { categoryTypes } from "$lib/constants";
import { category } from "$lib/server/db/schema";

export const listCategories = query(async () => {
  const { locals: { db}} = getRequestEvent()
	const categories = await db.select().from(category).orderBy(category.name)
	categories.sort((a, b) => categoryTypes.indexOf(a.type) - categoryTypes.indexOf(b.type)) // Sort by order defined in categoryTypes
	return categories
})
