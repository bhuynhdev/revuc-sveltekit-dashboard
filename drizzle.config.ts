import { defineConfig, type Config } from 'drizzle-kit'
import crypto from 'crypto'
import { mkdirSync } from 'fs'
import path from 'path'

// Based on https://github.com/cloudflare/workers-sdk/blob/main/packages/miniflare/src/plugins/shared/index.ts#L194
function idFromName(uniqueKey: string, name: string) {
	const key = crypto.createHash('sha256').update(uniqueKey).digest()
	const nameHmac = crypto.createHmac('sha256', key).update(name).digest().subarray(0, 16)
	const hmac = crypto.createHmac('sha256', key).update(nameHmac).digest().subarray(0, 16)
	return Buffer.concat([nameHmac, hmac]).toString('hex')
}

// Knowing the path used by wrangler allows drizzle-kit migrate/push to create the database in advance
export function getLocalD1Path(databaseBindingName: string) {
	const uniqueKey = 'miniflare-D1DatabaseObject'
	const dbDir = path.join('.wrangler', 'state', 'v3', 'd1', uniqueKey)
	mkdirSync(dbDir, { recursive: true })
	const dbPath = path.join(dbDir, idFromName(uniqueKey, databaseBindingName) + '.sqlite')
	console.log('Using', dbPath)
	return dbPath
}

let config: Config

console.log(`Environment: ${process.env.NODE_ENV}`)

if (process.env.NODE_ENV === 'production') {
	config = {
		schema: './src/lib/server/db/schema.ts',
		out: './drizzle/migrations/',
		dialect: 'sqlite',
		verbose: true,
		strict: true,
		driver: 'd1-http',
		dbCredentials: {
			token: process.env.CLOUDFLARE_API_TOKEN!,
			databaseId: process.env.CLOUDFLARE_D1_ID!,
			accountId: process.env.CLOUDFLARE_ACCOUNT_ID!
		}
	}
} else {
	config = {
		schema: './src/lib/server/db/schema.ts',
		out: './drizzle/migrations',
		dialect: 'sqlite',
		verbose: true,
		strict: true,
		dbCredentials: {
			url: getLocalD1Path('DB')
		}
	}
}

export default defineConfig(config)
