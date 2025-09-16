import { form, getRequestEvent, query } from "$app/server"
import { RotatingQueue } from "$lib/rotating-queue"
import { assignment, judge, judgeGroup } from "$lib/server/db/schema"
import type { Category } from "$lib/server/db/types"
import { strictEqual } from "assert"
import { eq, sql } from "drizzle-orm"

export const listAssignments = query(async () => {
  const { locals: { db } } = getRequestEvent()
  return await db.query.assignment.findMany(
    {
      with: {
        submission: { with: { project: true } },
        judgeGroup: { with: { category: true, judges: true } }
      },
    })
})


export const assignSubmissionsToJudgeGroups = form(async () => {
  const { locals: { db } } = getRequestEvent()
  // Preconditions: Each project should be seen by at least 6 judges, meaning we must have >= 6 General judges, since some projects only submit to General
  const MINIMUM_JUDGES_PER_PROJECT = 6
  const countGeneralJudges = await db.$count(judge, eq(judge.categoryId, 1))
  if (countGeneralJudges < MINIMUM_JUDGES_PER_PROJECT) {
    throw Error(`There must be at least ${MINIMUM_JUDGES_PER_PROJECT} General judges`);
  }

  await db.delete(assignment)

  const allSubmissions = await db.query.submission.findMany({ with: { category: true } })
  const allGroups = await db.select({
    id: judgeGroup.id,
    categoryId: judgeGroup.categoryId,
    judgeCount: sql<number>`count(${judge.id})`.mapWith(Number)
  })
    .from(judgeGroup)
    .leftJoin(judge, eq(judgeGroup.id, judge.judgeGroupId))
    .groupBy(judgeGroup.id)

  if (!allGroups.length) {
    throw Error('Need judge groups before assigning projects')
  }

  const groupsByCategory = allGroups.reduce((acc, curr) => {
    if (acc.get(curr.categoryId)) {
      acc.get(curr.categoryId)!.enqueue(curr);
    } else {
      acc.set(curr.categoryId, new RotatingQueue([curr]));
    }
    return acc
  }, new Map<Category['id'], RotatingQueue<typeof allGroups[number]>>())

  const PHASE_1_JUDGE_GROUPS_PER_PROJECT: Record<Category['type'], number> = {
    'inhouse': 2,
    'general': 1,
    'sponsor': 1,
    'mlh': 0
  }

  // Project assignment algorithm:
  // Phase 1: Assign submissions to judge groups of corresponding category, ensuring JUDGE_GROUPS_PER_PROJECT groups per project, while recording how many judges per project
  // Phase 2: Make additional General assignments if any projects have less than MINIMUM_JUDGE_PER_PROJECT judges
  const assignmentsByProject = allSubmissions.reduce((acc, s) => {
    const howManyJudgeGroups = groupsByCategory.get(s.categoryId)?.length || 0
    const suggestedJudgeGroupNumber = PHASE_1_JUDGE_GROUPS_PER_PROJECT[s.category.type]
    const judgeGroupsPerSubmission = Math.min(howManyJudgeGroups, suggestedJudgeGroupNumber)

    const assignments = Array.from({ length: judgeGroupsPerSubmission }).map(() => {
      const groupToAssign = groupsByCategory.get(s.categoryId)!.getNext()
      return { submissionId: s.id, judgeGroup: groupToAssign }
    })

    acc.set(s.projectId, (acc.get(s.projectId) || []).concat(assignments))

    return acc
  }, new Map<number, Array<{ submissionId: number, judgeGroup: typeof allGroups[number] }>>())

  // Phase 2: Assign additional General groups
  for (const [projectId, assignments] of assignmentsByProject) {
    let howManyJudgesThisProject = assignments.reduce((acc, curr) => acc + curr.judgeGroup.judgeCount, 0)
    const GENERAL_CATEGORY_ID = 1
    const generalSubmissionOfThisProject = allSubmissions.find(s => s.projectId === projectId && s.categoryId === GENERAL_CATEGORY_ID)!
    while (howManyJudgesThisProject < MINIMUM_JUDGES_PER_PROJECT) {
      const nextGeneralGroup = groupsByCategory.get(GENERAL_CATEGORY_ID)!.getNext()
      const currentGroups = assignments.map(a => a.judgeGroup.id)
      if (!currentGroups.includes(nextGeneralGroup.id)) {
        assignments.push({ submissionId: generalSubmissionOfThisProject.id, judgeGroup: nextGeneralGroup })
        howManyJudgesThisProject += nextGeneralGroup.judgeCount
      }
    }
  }


  // Some final post-condition checks
  const projectsWithInsufficientJudges = [...assignmentsByProject.entries()]
    .map(([projectId, assignments]) => ([projectId, assignments.reduce((acc, curr) => acc + curr.judgeGroup.judgeCount, 0)]) as const)
    .filter(([_, judgeCount]) => judgeCount < MINIMUM_JUDGES_PER_PROJECT)

  strictEqual(projectsWithInsufficientJudges.length, 0)

  const assignmentsToInsert = [...assignmentsByProject.values()]
    .flatMap(
      assignments => assignments.map(a => ({ submissionId: a.submissionId, judgeGroupId: a.judgeGroup.id }))
    )

  const seen = new Set();
  const duplicates = [];
  for (const entry of assignmentsToInsert) {
    const key = `${entry.submissionId}:${entry.judgeGroupId}`;
    if (seen.has(key)) {
      duplicates.push(entry);
    } else {
      seen.add(key);
    }
  }

  strictEqual(duplicates.length, 0)

  // Split into batch because Cloudflare D1 has limit on SQL statement size
  const BATCH_SIZE = 50;
  for (let i = 0; i < assignmentsToInsert.length; i += BATCH_SIZE) {
    const batch = assignmentsToInsert.slice(i, i + BATCH_SIZE);
    await db.insert(assignment).values(batch);
  }

  await listAssignments().refresh()
})


