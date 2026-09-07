import type { LayoutServerLoad } from './$types';
import { asAppUser } from '$lib/server/session';
import { readLocaleCookie } from '$lib/i18n/cookie';

export const load: LayoutServerLoad = async (event) => {
	const user = asAppUser(event.locals.user);
	return {
		user,
		locale: user?.locale ?? readLocaleCookie(event.cookies)
	};
};
