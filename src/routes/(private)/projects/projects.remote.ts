import { form, getRequestEvent, query } from "$app/server"
import { category, project, submission } from "$lib/server/db/schema"
import { parseDevPostProjectsCsv } from "$lib/server/devPostParsing"
import { eq, notInArray } from "drizzle-orm"

export const listProjects = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const projectAndSubmissions = await db.query.project.findMany({ with: { submissions: true } })
  return projectAndSubmissions
})

export const createProjectAndSubmissions = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const projectName = form.get('name') as string
  const url = form.get('url') as string
  const categoryIds = form.getAll('categoryIds').map(Number)
  const location = (form.get('location') as string) || ''
  const location2 = (form.get('location2') as string) || ''

  const [newProject] = await db.insert(project).values({ name: projectName, url, location, location2 }).returning()
  await db.insert(submission).values(categoryIds.map((categoryId) => ({ projectId: newProject.id, categoryId })))
})

export const importProjectsFromDevpost = form(async (form) => {
  // TODO: Don't allow create/import projects with judging has been assigned
  const { locals: { db } } = getRequestEvent()
  const categories = await db.select().from(category)
  const categoryNameToIdMap = categories.reduce((acc, category) => ({ ...acc, [category.name]: category.id }), {} as Record<string, number>)

  const csvFile = form.get('csvFile') as File
  if (csvFile.size === 0) {
    throw new Error('Error: File is empty!')
  }
  const csvContent = await csvFile.text()
  const projectsInput = parseDevPostProjectsCsv(csvContent)

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
})

export const updateProjectInfo = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const projectId = Number(form.get('projectId'))
  const projectName = form.get('name') as string
  const categoryIds = form.getAll('categoryIds').map(Number)
  const location = (form.get('location') as string) || ''
  const location2 = (form.get('location2') as string) || ''
  await db.update(project).set({ name: projectName, location, location2 }).where(eq(project.id, projectId))

  // Remove submissions not in the given category Ids
  await db.delete(submission).where(notInArray(submission.categoryId, categoryIds))
  // Add new submissions, ignoring already existed
  await db
    .insert(submission)
    .values(categoryIds.map((categoryId) => ({ projectId: projectId, categoryId })))
    .onConflictDoNothing({ target: [submission.categoryId, submission.projectId] })
})

/**
 * Disqualify project if not yet, or re-qualify if already disqualified
 **/
export const toggleProjectDisqualification = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const projectId = Number(form.get('projectId'))
  const disqualifyReason = form.get('disqualifyReason') as string
  const shouldUpdateDisqualifyReasonOnly = form.get('update-disqualify-reason-only') === 'true'

  const [projectToUpdate] = await db.select().from(project).where(eq(project.id, projectId)).limit(1)

  if (shouldUpdateDisqualifyReasonOnly || projectToUpdate.status !== 'disqualified') {
    await db.update(project).set({ status: 'disqualified', disqualifyReason: disqualifyReason })
  } else {
    await db.update(project).set({ status: 'created', disqualifyReason: null })
  }
})

export const deleteProject = form(async (form) => {
  const { locals: { db } } = getRequestEvent()
  const projectId = form.get('projectId') as string
  await db.delete(project).where(eq(project.id, Number(projectId)))
})

