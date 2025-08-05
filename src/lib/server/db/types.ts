import type { BuildQueryResult, DBQueryConfig, ExtractTablesWithRelations } from 'drizzle-orm'
import * as schema from './schema'

// Infering table model with relations
// Credit: https://github.com/drizzle-team/drizzle-orm/issues/695#issuecomment-1881454650
type TSchema = ExtractTablesWithRelations<typeof schema>

export type IncludeRelation<TableName extends keyof TSchema> = DBQueryConfig<'one' | 'many', boolean, TSchema, TSchema[TableName]>['with']

export type ResultWithRelation<TableName extends keyof TSchema, With extends IncludeRelation<TableName> | undefined = undefined> = BuildQueryResult<
	TSchema,
	TSchema[TableName],
	{
		with: With
	}
>

export type Session = typeof schema.session.$inferSelect

export type Participant = typeof schema.participant.$inferSelect
export type ParticipantInsert = typeof schema.participant.$inferSelect
export type ParticipantUpdate = Partial<ParticipantInsert>
export type AttendanceStatus = (typeof schema.attendanceStatuses)[number]

export type Category = typeof schema.category.$inferSelect
export type NewCategory = typeof schema.category.$inferInsert
export type CategoryType = Category['type']

export type MailCampaign = typeof schema.mailCampaign.$inferSelect
export type MailCampaignInsert = typeof schema.mailCampaign.$inferInsert

export type MailLog = typeof schema.mailLog.$inferSelect
export type MailLogInsert = typeof schema.mailLog.$inferInsert

export type User = typeof schema.user.$inferSelect

export type JudgeGroup = typeof schema.judgeGroup.$inferSelect
export type NewJudgeGroup = typeof schema.judgeGroup.$inferInsert
export type JudgeGroupWithJudges = ResultWithRelation<'judgeGroup', { judges: true; category: true }>

export type Judge = typeof schema.judge.$inferSelect
export type JudgeWithGroup = ResultWithRelation<'judge', { group: true }>
export type JudgeWithCategory = ResultWithRelation<'judge', { category: true }>
export type NewJudge = typeof schema.judge.$inferInsert

export type Project = typeof schema.project.$inferSelect
export type ProjectWithSubmission = ResultWithRelation<'project', { submissions: true }>
export type NewProject = typeof schema.project.$inferInsert

export type Assignment = typeof schema.assignment.$inferSelect
export type AssignmentDto = ResultWithRelation<'assignment', { judgeGroup: { with: { category: true }}, submission: { with: { project: true } } }>
export type NewAssignment = typeof schema.assignment.$inferInsert
