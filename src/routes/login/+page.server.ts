import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import { coerceLocale, t } from '$lib/i18n/catalog';
import { readLocaleCookie, setLocaleFromForm, writeLocaleCookie } from '$lib/i18n/cookie';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	locale: async (event) => setLocaleFromForm(event),
	login: async (event) => {
		const locale = readLocaleCookie(event.cookies);
		const form = await event.request.formData();
		const email = form.get('email')?.toString() ?? '';
		const password = form.get('password')?.toString() ?? '';
		try {
			await auth.api.signInEmail({
				body: { email, password },
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(401, { message: t(locale, 'auth.error') });
			}
			throw error;
		}
		const session = await auth.api.getSession({ headers: event.request.headers });
		const extra = session?.user as { locale?: string } | undefined;
		writeLocaleCookie(event.cookies, coerceLocale(extra?.locale ?? locale));
		throw redirect(302, '/receive');
	}
};
