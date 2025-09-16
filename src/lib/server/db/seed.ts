import assert from 'assert'
import { drizzle } from 'drizzle-orm/libsql'
import { reset, seed } from 'drizzle-seed'
import { getLocalD1Path } from '../../../../drizzle.config'
import { participant, category, judge, judgeGroup, project, submission } from './schema'
import { type NewCategory } from './types'

async function developmentSeed() {
	assert(process.env.NODE_ENV == 'development', 'Can only seed in development mode')

	const localD1DbUrl = getLocalD1Path('DB')
	const db = drizzle(`file:${localD1DbUrl}`)

	const SEED = 1234

	await reset(db, { participant, judge, judgeGroup, project, submission })

	const categorySeeds: NewCategory[] = [
		{ type: 'general', name: 'General' },
		{ type: 'inhouse', name: 'Most Technically Impressive' },
		{ type: 'inhouse', name: 'Best "Useless" Hack' },
		{ type: 'inhouse', name: 'Best Social Impact' },
		{ type: 'inhouse', name: 'Best Business Plan' },
		{ type: 'inhouse', name: 'Best Use of Augemented Reality (AR)' },
		{ type: 'sponsor', name: 'Kinetic Vision Sponsor Challenge' },
		{ type: 'sponsor', name: 'Fifth Third Sponsor Challenge' },
		{ type: 'sponsor', name: 'Medpace Sponsor Challenge' },
		{ type: 'sponsor', name: 'AWS Sponsor Challenge' },
		{ type: 'sponsor', name: "Parkinson's Together Sponsor Challenge" },
		{ type: 'mlh', name: 'Best .Tech Domain Name' },
		{ type: 'mlh', name: 'Best AI Application Built with Cloudflare' },
		{ type: 'mlh', name: 'Best Use of Gemini API' },
		{ type: 'mlh', name: 'Best Use of MongoDB Atlas' }
	]
	await db.insert(category).values(categorySeeds).onConflictDoNothing()

	await seed(db, { participant, judge }, { seed: SEED }).refine((f) => {
		return {
			participant: {
				count: 50,
				columns: {
					firstName: f.firstName(),
					lastName: f.lastName(),
					email: f.email(),
					attendanceStatus: f.valuesFromArray({ values: ['registered', 'confirmed', 'waitlist'] }),
					createdAt: f.default({ defaultValue: new Date().toISOString() }),
					phone: f.phoneNumber({ template: '###-###-####' }),
					age: f.int({ minValue: 16, maxValue: 25 }),
					graduationYear: f.int({ minValue: 2015, maxValue: 2025 }),
					levelOfStudy: f.valuesFromArray({ values: ['undergraduate', 'graduate', 'phd', 'highschool'] }),
					gender: f.valuesFromArray({ values: ['male', 'female', 'nonbinary', 'other', 'noanswer'] }),
					school: f.valuesFromArray({ values: ['University of Cincinnati', 'Hardvard University', 'Dartmouth College'] }),
					country: f.country(),
					major: f.default({ defaultValue: 'Computer Science' }),
					dietRestrictions: f.valuesFromArray({ values: ['none', '', 'vegan'] }),
					resumeUrl: f.default({ defaultValue: null }),
					notes: f.default({ defaultValue: null }),
					updatedAt: f.default({ defaultValue: null }),
					deletedAt: f.default({ defaultValue: null }),
					checkedInAt: f.default({ defaultValue: null }),
					lastConfirmedAttendanceAt: f.default({ defaultValue: null })
				}
			},
			judge: {
				count: 40,
				columns: {
					email: f.email(),
					name: f.fullName(),
					categoryId: f.int({ minValue: 1, maxValue: categorySeeds.filter((c) => c.type !== 'mlh').length }),
					judgeGroupId: f.default({ defaultValue: null }),
					uuid: f.default({ defaultValue: undefined }),
				}
			}
		}
	})

	console.log('Seed done')
	process.exit(0)
}

developmentSeed()
