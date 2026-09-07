import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 8 },
	user: {
		additionalFields: {
			firstName: { type: 'string', required: true, input: true },
			lastName: { type: 'string', required: false, input: true },
			locale: { type: 'string', required: true, defaultValue: 'it', input: true },
			currentFamilyId: { type: 'string', required: false, input: false }
		}
	},
	trustedOrigins: env.ORIGIN ? [env.ORIGIN] : [],
	plugins: [sveltekitCookies(getRequestEvent)]
});
