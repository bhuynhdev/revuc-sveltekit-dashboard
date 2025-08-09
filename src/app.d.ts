// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import { type D1Database } from '@cloudflare/workers-types';
import { type DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from '$lib/server/db/schema'

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: DrizzleD1Database<typeof schema>
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        DB: D1Database
      };
    }
  }
}

export { }

