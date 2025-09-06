import { getRequestEvent } from "$app/server";
import { judge } from "$lib/server/db/schema";

export async function GET() {
  const { locals: { db } } = getRequestEvent()
  const allJudges = await db.select().from(judge)

  const csv = allJudges
    .map(j => [j.name, j.email, j.categoryId].join(','))
    .join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="judges-export.csv"'
    }
  });
}

