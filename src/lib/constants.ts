export const attendanceStatuses = [
  'registered',
  'declined',
  'confirmed',
  'confirmeddelayedcheckin',
  'attended',
  'waitlist',
  'waitlistattended'
] as const

export const categoryTypes = ['general', 'inhouse', 'sponsor', 'mlh'] as const

export const DEFAULT_ITEMS_PER_PAGINATION = 20;
