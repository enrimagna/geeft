import type { Cookies, RequestEvent } from '@sveltejs/kit';
import { coerceLocale, type Locale } from './catalog';

export const LOCALE_COOKIE = 'PARAGLIDE_LOCALE';

export function readLocaleCookie(cookies: Cookies): Locale {
	return coerceLocale(cookies.get(LOCALE_COOKIE));
}

export function writeLocaleCookie(cookies: Cookies, locale: Locale) {
	cookies.set(LOCALE_COOKIE, locale, {
		path: '/',
		maxAge: 34560000,
		sameSite: 'lax',
		httpOnly: false
	});
}

export async function setLocaleFromForm(event: RequestEvent) {
	const form = await event.request.formData();
	const locale = coerceLocale(form.get('locale')?.toString());
	writeLocaleCookie(event.cookies, locale);
	return { ok: true as const };
}
