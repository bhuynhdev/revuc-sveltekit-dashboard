import * as v from "valibot"
import { getRequestEvent, query } from "$app/server";
import { attendanceStatuses, DEFAULT_ITEMS_PER_PAGINATION } from "$lib/constants";
import { and, eq, like, sql } from "drizzle-orm";
import { participant } from "$lib/server/db/schema";
import "@total-typescript/ts-reset/filter-boolean"
import { error } from "@sveltejs/kit";
import type { AttendanceStatus, Participant } from "$lib/server/db/types";

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

type AttendanceAction = 'CheckIn' | 'ConfirmAttendance' | 'Unconfirm' | 'ToggleLateCheckIn'

/**
 * State machine describing possible transitions given an input attendance status
 * And return the next status given a particular transition
 *
 * Example:
 * ```
 * const newStatus = ATTENDANCE_STATUS_STATE_MACHINE[currentStatus]['CheckIn']
 * ```
 */
const ATTENDANCE_STATUS_STATE_MACHINE: Record<AttendanceStatus, Partial<Record<AttendanceAction, AttendanceStatus>>> = {
  registered: {
    get ConfirmAttendance() {
      // TODO: Check waitlist
      const isWaitlisted = false
      return isWaitlisted ? 'waitlist' : 'confirmed'
    }
  },
  declined: {
    get ConfirmAttendance() {
      // Treat declined same as registered when it comes to confirming attendance
      return ATTENDANCE_STATUS_STATE_MACHINE.registered.ConfirmAttendance
    }
  },
  confirmed: {
    CheckIn: 'attended',
    ToggleLateCheckIn: 'confirmeddelayedcheckin',
    Unconfirm: 'declined'
  },
  confirmeddelayedcheckin: {
    CheckIn: 'attended',
    ToggleLateCheckIn: 'confirmed'
  },
  waitlist: {
    CheckIn: 'waitlistattended'
  },
  attended: {},
  waitlistattended: {}
} as const

/**
 * Given the current attendance status and action, determine the next attendance status
 */
function determineNextAttendanceStatus(args: { currentStatus: AttendanceStatus; action: AttendanceAction }): AttendanceStatus | null {
  const currentState = ATTENDANCE_STATUS_STATE_MACHINE[args.currentStatus]
  const potentialTransitions = Object.keys(currentState)
  if (potentialTransitions.length == 0) {
    return null // No more transition available at this state
  }
  if (args.action in currentState) {
    return currentState[args.action as keyof typeof currentState] ?? null
  }
  throw Error(`AttendanceAtion ${args.action} is not possible given state ${args.currentStatus}`)
}

/**
 * Determine the next attendance action to display on the UI
 * given the current attendance status
 */
function getNextAttendanceActions(currentStatus: AttendanceStatus): Array<AttendanceAction> {
  return Object.getOwnPropertyNames(ATTENDANCE_STATUS_STATE_MACHINE[currentStatus]) as Array<
    keyof (typeof ATTENDANCE_STATUS_STATE_MACHINE)[AttendanceStatus]
  >
}

export type ParticipantDto = Participant & { availableAttendanceActions: ReturnType<typeof getNextAttendanceActions> }
