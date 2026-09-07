import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { actionFail } from '$lib/server/errors';
import { requirePageUser } from '$lib/server/session';
import { coerceLocale, t } from '$lib/i18n/catalog';
import { writeLocaleCookie } from '$lib/i18n/cookie';
import { passwordChangedMail, queueMail } from '$lib/server/mail';
import { APIError } from 'better-auth/api';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const current = requirePageUser(event);
	return { email: current.email };
};

function mailUser(current: { email: string; firstName: string; locale: string }) {
	return {
		email: current.email,
		name: current.firstName,
		locale: current.locale
	};
}

export const actions: Actions = {
	locale: async (event) => {
		const current = requirePageUser(event);
		try {
			const form = await event.request.formData();
			const locale = coerceLocale(form.get('locale')?.toString());
			db.update(user).set({ locale, updatedAt: new Date() }).where(eq(user.id, current.id)).run();
			try {
				await auth.api.updateUser({
					body: { locale },
					headers: event.request.headers
				});
			} catch {
				/* session fields also live in sqlite user.locale */
			}
			writeLocaleCookie(event.cookies, locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	password: async (event) => {
		const current = requirePageUser(event);
		try {
			const form = await event.request.formData();
			const currentPassword = form.get('currentPassword')?.toString() ?? '';
			const newPassword = form.get('newPassword')?.toString() ?? '';
			const confirm = form.get('confirm')?.toString() ?? '';
			if (newPassword.length < 8) {
				return fail(422, { message: t(current.locale, 'error.validation') });
			}
			if (newPassword !== confirm) {
				return fail(422, { message: t(current.locale, 'auth.password.mismatch') });
			}
			try {
				await auth.api.changePassword({
					body: { currentPassword, newPassword, revokeOtherSessions: true },
					headers: event.request.headers
				});
			} catch (error) {
				if (error instanceof APIError) {
					return fail(401, { message: t(current.locale, 'auth.error') });
				}
				throw error;
			}
			queueMail(passwordChangedMail(mailUser(current)));
			return { passwordChanged: true as const };
		} catch (error) {
			return actionFail(error);
		}
	},
	logout: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(302, '/login');
	}
};
