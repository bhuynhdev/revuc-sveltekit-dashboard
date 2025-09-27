import { form, getRequestEvent, query } from "$app/server"
import { category, project, submission } from "$lib/server/db/schema"
import type { Project } from "$lib/server/db/types"
import { parseDevPostProjectsCsv } from "$lib/server/devPostParsing"
import { and, eq, notInArray } from "drizzle-orm"
import * as v from "valibot"

export const listProjects = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const projectAndSubmissions = await db.query.project.findMany({ with: { submissions: true } })
  return projectAndSubmissions
})

export const createProjectAndSubmissions = form(
  v.object({
    name: v.string(),
    url: v.string(),
    categoryIds: v.array(v.pipe(v.string(), v.transform(Number), v.number())),
    location: v.optional(v.string(), ""),
    location2: v.optional(v.string(), "")
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { name, url, categoryIds, location, location2 } = form
    const [newProject] = await db.insert(project).values({ name, url, location, location2 }).returning()
    await db.insert(submission).values(categoryIds.map((categoryId) => ({ projectId: newProject.id, categoryId })))
  })

export const importProjectsFromDevpost = form(
  v.object({
    csvFile: v.pipe(v.file(), v.notSize(0, 'Error: File is empty!'))
  }),
  async (form) => {
    // TODO: Don't allow create/import projects when judging assignments has been made
    const { locals: { db } } = getRequestEvent()
    const categories = await db.select().from(category)
    const categoryNameToIdMap = categories.reduce((acc, category) => ({ ...acc, [category.name]: category.id }), {} as Record<string, number>)

    const projectsInput = parseDevPostProjectsCsv(await form.csvFile.text())

    // Delete all current projects and submissions, and insert new ones obtained from the CSV
    await db.delete(submission)
    await db.delete(project)

    for (const p of projectsInput) {
      if (p.status.toLowerCase() === 'draft') continue // Skip 'Draft' projects

      const [{ insertedProjectId }] = await db
        .insert(project)
        .values({ name: p.title, location: p.location, location2: '', url: p.url })
        .returning({ insertedProjectId: project.id })

      const submittedCategories = p.categoriesCsv.split(',')
      if (!submittedCategories.includes('General')) {
        submittedCategories.push('General')
      }

      const submittedCategoryIds = submittedCategories
        .map((individualCategoryName) => {
          const trimmedCategoryName = individualCategoryName.trim()
          if (!trimmedCategoryName) return
          if (!(trimmedCategoryName in categoryNameToIdMap)) {
            console.log(`Project: '${p.title}': Category '${trimmedCategoryName}' doesn't exist. Skipping submission to this category.`)
            return
          }
          return categoryNameToIdMap[trimmedCategoryName]
        })
        .filter(Boolean)

      await db.insert(submission).values(submittedCategoryIds.map((c) => ({ categoryId: c, projectId: insertedProjectId })))
    }
    await listProjects().refresh()
  }
)

export const updateProjectInfo = form(
  v.object({
    projectId: v.pipe(v.string(), v.transform(Number), v.number()),
    projectName: v.string(),
    categoryIds: v.array(v.pipe(v.string(), v.transform(Number), v.number())),
    location: v.optional(v.string(), ""),
    location2: v.optional(v.string(), ""),
  }), async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { projectId, projectName, categoryIds, location, location2 } = form
    await db.update(project).set({ name: projectName, location, location2 }).where(eq(project.id, projectId))

    // Remove submissions not in the given category Ids
    await db.delete(submission).where(and(eq(submission.projectId, projectId), notInArray(submission.categoryId, categoryIds)))
    // Add new submissions, ignoring already existed
    await db
      .insert(submission)
      .values(categoryIds.map((categoryId) => ({ projectId: projectId, categoryId })))
      .onConflictDoNothing({ target: [submission.categoryId, submission.projectId] })

    await listProjects().refresh()
  }
)

/**
 * Disqualify project if not yet, or re-qualify if already disqualified
 **/
export const toggleProjectDisqualification = form(
  v.object({
    projectId: v.pipe(v.string(), v.transform(Number), v.number()),
    disqualifyReason: v.string(),
    // For use when project is already disqualifed but we only want to update the reason, instead of toggling disqualify/qualify
    updateDisqualifyReasonOnly: v.optional(v.literal('true'))
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const { projectId, disqualifyReason, updateDisqualifyReasonOnly } = form
    const shouldUpdateDisqualifyReasonOnly = updateDisqualifyReasonOnly === 'true'

    const [projectToUpdate] = await db.select().from(project).where(eq(project.id, projectId)).limit(1)
    const newProjectStatus: Project['status'] = projectToUpdate.status === 'created' ? 'disqualified' : 'created'

    if (shouldUpdateDisqualifyReasonOnly) {
      await db.update(project).set({ disqualifyReason: disqualifyReason })
    } else {
      await db.update(project).set({ status: newProjectStatus, disqualifyReason: null })
    }

    await listProjects().refresh()
  }
)

export const deleteProject = form(
  v.object({
    projectId: v.pipe(v.string(), v.transform(Number), v.number())
  }),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    await db.delete(project).where(eq(project.id, form.projectId))

    await listProjects().refresh()
  }
)

