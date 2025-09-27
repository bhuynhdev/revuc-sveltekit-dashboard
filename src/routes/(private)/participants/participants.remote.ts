import { form, getRequestEvent, query } from "$app/server";
import { attendanceStatuses } from "$lib/constants";
import { attendanceActions, determineNextAttendanceStatus, getNextAttendanceActions, type AttendanceAction } from "$lib/server/attendanceAction";
import { participant } from "$lib/server/db/schema";
import type { AttendanceStatus, Participant, ParticipantUpdate } from "$lib/server/db/types";
import { error } from "@sveltejs/kit";
import "@total-typescript/ts-reset/filter-boolean";
import { and, eq, like, sql } from "drizzle-orm";
import * as v from "valibot";

const listParticipantsSchema = v.object({
  query: v.nullable(v.string()),
  attendanceStatus: v.nullable(v.picklist(attendanceStatuses)),
  pageNumber: v.pipe(v.number(), v.minValue(1)),
  perPage: v.pipe(v.number(), v.minValue(1)),
})

/** Fetch participants based on query string input parameters:
 *  - query: Search that name and/or email includes the search phrase
 *  - status: Specific attendance status
 *  - pageNumber: Pagination
 *  - perPage: How many items per page
 */
export const listParticipants = query(listParticipantsSchema, async (args) => {
  const { locals: { db } } = getRequestEvent()
  const { query, attendanceStatus, pageNumber, perPage } = args;

  const searchCriteria = [
    query && like(participant.nameEmail, `%${query}%`),
    attendanceStatus && eq(participant.attendanceStatus, attendanceStatus)
  ].filter(Boolean)

  const whereStatement = searchCriteria.length ? and(...searchCriteria) : undefined

  const totalCount = await db.$count(participant, whereStatement)

  // Constraint `pageNumber` in case user inputs a weird number
  const maxNumberOfPages = Math.max(Math.ceil(totalCount / perPage), 1)
  if (pageNumber > maxNumberOfPages) {
    throw error(400, 'Page number is not valid')
  }

  // Offset-based pagination: Use Deferred Join technique to optimize https://orm.drizzle.team/docs/guides/limit-offset-pagination
  const sq = db
    .select({ id: participant.id })
    .from(participant)
    .where(whereStatement)
    .orderBy(participant.createdAt, participant.id)
    .limit(perPage)
    .offset((pageNumber - 1) * perPage)
    .as('subquery')

  const participants = await db.select().from(participant).innerJoin(sq, eq(participant.id, sq.id)).orderBy(participant.createdAt, participant.id)
  return {
    totalCount, participants: participants.map(({ participant }) => ({
      ...participant,
      availableAttendanceActions: getNextAttendanceActions(participant.attendanceStatus)
    }))
  }
})

/**
 * Calculate some participant statistics, including:
 *  - Participants count by attendance statuses
 */
export const listParticipantsStatistics = query(async () => {
  const { locals: { db } } = getRequestEvent()
  const rawStatusCountArray = await db
    .select({ status: participant.attendanceStatus, count: sql<number>`COUNT(*)`.mapWith(Number) })
    .from(participant)
    .groupBy(participant.attendanceStatus)

  // Convert to object format { [status]: [count] }
  const participantCountByStatus = Object.fromEntries(attendanceStatuses.map((status) => [status, 0])) as Record<AttendanceStatus, number> // Init with 0s
  rawStatusCountArray.forEach(({ status, count }) => (participantCountByStatus[status] += count))

  return { participantCountByStatus }
})

export const updateParticipantInfo = form(
  v.objectWithRest({ participantId: v.string() }, v.string()),
  async (form) => {
    const { locals: { db } } = getRequestEvent()
    const now = new Date().toISOString()
    const { participantId, ...participantData } = form
    const pId = parseInt(participantId.toString())

    await db
      .update(participant)
      .set({ ...participantData, updatedAt: now })
      .where(eq(participant.id, pId))
      .returning()
  })

export const advanceAttendanceStatus = form(v.object({
  participantId: v.string(),
  attendanceAction: v.picklist(attendanceActions)
}), async (form) => {
  const { locals: { db } } = getRequestEvent()
  const now = new Date().toISOString()
  const { participantId, attendanceAction } = form
  const pId = parseInt(participantId.toString())

  const [participantInfo] = await db.select().from(participant).where(eq(participant.id, pId))
  const currentAttendanceStatus = participantInfo.attendanceStatus

  const newAttendanceStatus = determineNextAttendanceStatus({ currentStatus: currentAttendanceStatus, action: attendanceAction as AttendanceAction })

  const updateContent: ParticipantUpdate = { updatedAt: now }
  if (newAttendanceStatus) {
    updateContent.attendanceStatus = newAttendanceStatus
    if (attendanceAction === 'CheckIn') {
      updateContent.checkedInAt = now
    } else if (attendanceAction === 'ConfirmAttendance') {
      updateContent.lastConfirmedAttendanceAt = now
    }
  }

  if (newAttendanceStatus) {
    await db.update(participant).set(updateContent).where(eq(participant.id, pId))
  }
})

export type ParticipantDto = Participant & { availableAttendanceActions: ReturnType<typeof getNextAttendanceActions> }

