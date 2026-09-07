import { env } from '$env/dynamic/private';
import { betterAuth } from 'better-auth/minimal';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { passwordChangedMail, passwordResetMail, queueMail } from '$lib/server/mail';

type MailUser = {
	email: string;
	name?: string | null;
	firstName?: string | null;
	locale?: string | null;
};

function displayName(user: MailUser): string | null {
	return user.firstName || user.name || null;
}

function asMailUser(user: { email: string; name: string }): MailUser {
	const extra = user as {
		email: string;
		name: string;
		firstName?: string | null;
		locale?: string | null;
	};
	return {
		email: extra.email,
		name: extra.name,
		firstName: extra.firstName,
		locale: extra.locale
	};
}

function resetUrl(token: string): string {
	const origin = env.ORIGIN?.replace(/\/$/, '') || 'http://localhost:5173';
	return `${origin}/reset-password?token=${encodeURIComponent(token)}`;
}

export const auth = betterAuth({
	baseURL: env.ORIGIN,
	secret: env.BETTER_AUTH_SECRET,
	database: drizzleAdapter(db, { provider: 'sqlite' }),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		minPasswordLength: 8,
		revokeSessionsOnPasswordReset: true,
		sendResetPassword: async ({ user, token }) => {
			const mailUser = asMailUser(user);
			queueMail(
				passwordResetMail({
					email: mailUser.email,
					name: displayName(mailUser),
					locale: mailUser.locale,
					url: resetUrl(token)
				})
			);
		},
		onPasswordReset: async ({ user }) => {
			const mailUser = asMailUser(user);
			queueMail(
				passwordChangedMail({
					email: mailUser.email,
					name: displayName(mailUser),
					locale: mailUser.locale
				})
			);
		}
	},
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
