import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { APIError } from 'better-auth/api';
import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { family } from '$lib/server/db/schema';
import { joinFamily } from '$lib/server/families';
import { hashInvite } from '$lib/server/invite';
import { coerceLocale, t } from '$lib/i18n/catalog';
import { writeLocaleCookie } from '$lib/i18n/cookie';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => ({});

export const actions: Actions = {
	default: async (event) => {
		const form = await event.request.formData();
		const email = form.get('email')?.toString() ?? '';
		const password = form.get('password')?.toString() ?? '';
		const firstName = form.get('firstName')?.toString()?.trim() ?? '';
		const lastName = form.get('lastName')?.toString()?.trim() || undefined;
		const locale = coerceLocale(form.get('locale')?.toString());
		const invite = form.get('invite')?.toString()?.trim() ?? '';

		if (!invite) return fail(422, { message: t(locale, 'auth.invite.required') });
		if (!firstName || !email || password.length < 8) {
			return fail(422, { message: t(locale, 'error.validation') });
		}

		const fam = db
			.select()
			.from(family)
			.where(eq(family.inviteCodeHash, hashInvite(invite)))
			.get();
		if (!fam) return fail(404, { message: t(locale, 'auth.invite.invalid') });

		try {
			await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: firstName,
					firstName,
					lastName,
					locale
				},
				headers: event.request.headers
			});
		} catch (error) {
			if (error instanceof APIError) {
				return fail(422, { message: error.message || t(locale, 'error.validation') });
			}
			throw error;
		}

		const session = await auth.api.getSession({ headers: event.request.headers });
		if (!session?.user) return fail(401, { message: t(locale, 'auth.error') });

		joinFamily(
			db,
			{
				id: session.user.id,
				email: session.user.email,
				name: firstName,
				firstName,
				lastName: lastName ?? null,
				locale,
				currentFamilyId: null
			},
			invite,
			locale
		);

		writeLocaleCookie(event.cookies, locale);
		throw redirect(302, '/receive');
	}
};
