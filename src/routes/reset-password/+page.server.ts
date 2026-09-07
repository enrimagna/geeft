import { fail, redirect } from '@sveltejs/kit';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import { t } from '$lib/i18n/catalog';
import { readLocaleCookie } from '$lib/i18n/cookie';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const token = event.url.searchParams.get('token') ?? '';
	const invalid = event.url.searchParams.get('error') === 'INVALID_TOKEN';
	return { token, invalid: invalid || !token };
};

export const actions: Actions = {
	default: async (event) => {
		const locale = readLocaleCookie(event.cookies);
		const form = await event.request.formData();
		const token = form.get('token')?.toString() ?? '';
		const password = form.get('password')?.toString() ?? '';
		const confirm = form.get('confirm')?.toString() ?? '';
		if (!token) return fail(422, { message: t(locale, 'auth.reset.invalid') });
		if (password.length < 8) return fail(422, { message: t(locale, 'error.validation') });
		if (password !== confirm) return fail(422, { message: t(locale, 'auth.password.mismatch') });
		try {
			await auth.api.resetPassword({
				body: { newPassword: password, token }
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(422, { message: t(locale, 'auth.reset.invalid') });
			}
			throw error;
		}
		throw redirect(302, '/login');
	}
};
