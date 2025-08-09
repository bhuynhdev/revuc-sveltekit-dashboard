import type { Handle } from '@sveltejs/kit';
import { drizzle } from 'drizzle-orm/d1';

export const handle: Handle = async ({ event, resolve }) => {
  if (!event.platform) {
    throw Error("Cloudflare is not here!")
  }
  if (!event.locals.db) {
    event.locals.db = drizzle(event.platform.env.DB)
  }

	const response = await resolve(event);
	return response;
};

