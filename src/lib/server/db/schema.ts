import { attendanceStatuses, categoryTypes } from '../../constants'
import { relations, sql, type SQL } from 'drizzle-orm'
import { blob, check, integer, primaryKey, sqliteTable, text, unique } from 'drizzle-orm/sqlite-core'

export const event = sqliteTable(
  'event',
  {
    id: integer('id').primaryKey(),
    timestamp: text('timestamp').notNull(),
    description: text('description').notNull(),
    performedBy: integer('performed_by').references(() => participant.id),
    targetParticipantId: integer('target_participant_id').references(() => participant.id),
    targetUserId: integer('target_user_id').references(() => user.id),
    extraInfo: text('extra_info', { mode: 'json' })
  },
  (table) => [
    // Only one target is allowed, either targetParticipant or targetUser. One of them must be null, and one of them must NOT null
    check(
      'only_one_target',
      sql`(${table.targetParticipantId} IS NOT NULL and ${table.targetUserId} IS NULL)
          OR (${table.targetParticipantId} IS NULL and ${table.targetUserId} IS NOT NULL)`
    )
  ]
)

export const participant = sqliteTable('participant', {
  id: integer('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  attendanceStatus: text('attendance_status', { enum: attendanceStatuses }).default('registered').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  age: integer('age').notNull(),
  gender: text('gender', { enum: ['male', 'female', 'nonbinary', 'other', 'noanswer'] }).notNull(),
  school: text('school').notNull(),
  graduationYear: integer('graduation_year').notNull(),
  levelOfStudy: text('level_of_study').notNull(),
  country: text('country').notNull(),
  major: text('major').notNull(),
  dietRestrictions: text('diet_restrictions').default('').notNull(),
  resumeUrl: text('resume_url'),
  notes: text('notes'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at'),
  deletedAt: text('deleted_at'),
  lastConfirmedAttendanceAt: text('last_confirmed_attendance_at'),
  checkedInAt: text('checkedin_at'),
  nameEmail: text('name_email')
    .notNull()
    .generatedAlwaysAs((): SQL => sql`lower(${participant.firstName} || ' ' || ${participant.lastName} || ' ' || ${participant.email})`)
})

export const user = sqliteTable('user', {
  id: integer('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role', { enum: ['admin', 'judge', 'pending'] }).notNull(),
  isDiabled: integer('is_disabled', { mode: 'boolean' }).default(false).notNull(),
})

export const category = sqliteTable('category', {
  id: integer('id').primaryKey(),
  name: text('name').unique().notNull(),
  type: text('type', { enum: categoryTypes }).notNull()
})

export const judgeGroup = sqliteTable('judge_group', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  categoryId: integer('category_id')
    .references(() => category.id, { onDelete: 'cascade' })
    .notNull()
})

export const judge = sqliteTable('judge', {
  id: integer('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  categoryId: integer('category_id')
    .notNull()
    .references(() => category.id, { onDelete: 'cascade' }),
  judgeGroupId: integer('judge_group_id').references(() => judgeGroup.id, { onDelete: 'set null' })
})

export const judgeGroupRelations = relations(judgeGroup, ({ one, many }) => ({
  judges: many(judge),
  category: one(category, { fields: [judgeGroup.categoryId], references: [category.id] })
}))

export const judgeRelations = relations(judge, ({ one }) => ({
  category: one(category, { fields: [judge.categoryId], references: [category.id] }),
  group: one(judgeGroup, { fields: [judge.judgeGroupId], references: [judgeGroup.id] })
}))

export const project = sqliteTable('project', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status', { enum: ['disqualified', 'created'] })
    .notNull()
    .default('created'),
  url: text('url'),
  location: text('location').notNull(),
  location2: text('location2').notNull(),
  disqualifyReason: text('disqualify_reason')
})

export const projectRelations = relations(project, ({ many }) => ({
  submissions: many(submission)
}))

export const submission = sqliteTable(
  'project_submission',
  {
    id: integer('id').primaryKey(),
    projectId: integer('project_id')
      .notNull()
      .references(() => project.id, { onDelete: 'cascade' }),
    categoryId: integer('category_id')
      .notNull()
      .references(() => category.id, { onDelete: 'cascade' })
  },
  (table) => [unique('project_and_category').on(table.projectId, table.categoryId)]
)

export const submissionsRelations = relations(submission, ({ one }) => ({
  project: one(project, { fields: [submission.projectId], references: [project.id] }),
  category: one(category, { fields: [submission.categoryId], references: [category.id] })
}))

export const assignment = sqliteTable('assignment', {
  submissionId: integer('submission_id').notNull().references(() => submission.id, { onDelete: 'cascade' }),
  judgeGroupId: integer('judge_group_id').notNull().references(() => judgeGroup.id, { onDelete: 'cascade' })
},
  (table) => [primaryKey({ columns: [table.judgeGroupId, table.submissionId] })]
)

export const assignmentRelations = relations(assignment, ({ one }) => ({
  submission: one(submission, { fields: [assignment.submissionId], references: [submission.id] }),
  judgeGroup: one(judgeGroup, { fields: [assignment.judgeGroupId], references: [judgeGroup.id] }),
}))

export const mailCampaign = sqliteTable('mail_campaign', {
  id: integer('id').primaryKey(),
  template: text('template').notNull(),
  createdAt: text('created_at').notNull(),
  recipientCount: integer('recipient_count').notNull()
})

export const mailLog = sqliteTable('mail_log', {
  id: integer('id').primaryKey(),
  mailCampaignId: integer('mail_campaign_id')
    .references(() => mailCampaign.id)
    .notNull(),
  recipientId: integer('recipient_id')
    .references(() => participant.id)
    .notNull(),
  createdAt: text('created_at').notNull(),
  status: text('status', { enum: ['new', 'failed', 'success'] })
    .default('new')
    .notNull()
})

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => user.id),
  secretHash: blob('secret_hash', { mode: 'buffer' }).notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})
