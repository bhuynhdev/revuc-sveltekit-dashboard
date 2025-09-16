import { getRequestEvent } from "$app/server";

export async function GET() {
  const { locals: { db } } = getRequestEvent()
  const allJudges = await db.query.judge.findMany({ with: { category: true } })

  const csv = allJudges
    .map(j => [j.name, j.email, j.category.name].join(','))
    .join('\n')

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="judges-export.csv"'
    }
  });
}

