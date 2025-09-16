import { getRequestEvent } from "$app/server";
import { stringify } from "csv-stringify/sync"

export async function GET() {
  const { locals: { db } } = getRequestEvent()
  const allJudges = await db.query.judge.findMany({ with: { category: true } })

  const csvData = allJudges.map(j => [j.name, j.email, j.category.name])
  const csv = stringify(csvData)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="judges-export.csv"'
    }
  });
}

