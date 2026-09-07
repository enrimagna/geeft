import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import { t } from '$lib/i18n/catalog';
import { readLocaleCookie, setLocaleFromForm } from '$lib/i18n/cookie';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	locale: async (event) => setLocaleFromForm(event),
	default: async (event) => {
		const locale = readLocaleCookie(event.cookies);
		const form = await event.request.formData();
		const email = form.get('email')?.toString()?.trim() ?? '';
		if (!email) return fail(422, { message: t(locale, 'error.validation') });
		const origin = env.ORIGIN?.replace(/\/$/, '') || event.url.origin;
		try {
			await auth.api.requestPasswordReset({
				body: { email, redirectTo: `${origin}/reset-password` }
			});
		} catch (error) {
			if (!(error instanceof APIError)) throw error;
		}
		return { sent: true as const };
	}
};
