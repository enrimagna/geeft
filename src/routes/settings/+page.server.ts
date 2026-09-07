import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { auth } from '$lib/server/auth';
import { actionFail } from '$lib/server/errors';
import { requirePageUser } from '$lib/server/session';
import { coerceLocale } from '$lib/i18n/catalog';
import { writeLocaleCookie } from '$lib/i18n/cookie';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const current = requirePageUser(event);
	return { email: current.email };
};

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
	logout: async (event) => {
		await auth.api.signOut({ headers: event.request.headers });
		throw redirect(302, '/login');
	}
};
