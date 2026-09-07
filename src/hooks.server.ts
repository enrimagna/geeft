import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { json, redirect } from '@sveltejs/kit';
import { coerceLocale } from '$lib/i18n/catalog';
import { LOCALE_COOKIE, writeLocaleCookie } from '$lib/i18n/cookie';
import { localeFromAcceptLanguage } from '$lib/i18n/prefer';
import { asAppUser } from '$lib/server/session';

const handleAnonymousLocale: Handle = async ({ event, resolve }) => {
	if (!event.cookies.get(LOCALE_COOKIE)) {
		writeLocaleCookie(
			event.cookies,
			localeFromAcceptLanguage(event.request.headers.get('accept-language'))
		);
	}
	return resolve(event);
};

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};

const handleUserLocale: Handle = async ({ event, resolve }) => {
	const current = asAppUser(event.locals.user);
	if (current) writeLocaleCookie(event.cookies, current.locale);
	return resolve(event);
};

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		const lang = coerceLocale(event.cookies.get(LOCALE_COOKIE) ?? locale);
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html.replace('%paraglide.lang%', lang).replace('%paraglide.dir%', getTextDirection(lang))
		});
	});

const protectedPrefixes = ['/receive', '/give', '/family', '/settings'];

const handleGuards: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const authed = Boolean(event.locals.user);
	if (protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))) {
		if (!authed) {
			if (path.startsWith('/api')) return json({ message: 'Unauthorized' }, { status: 401 });
			throw redirect(302, '/login');
		}
	}
	if (authed && (path === '/login' || path === '/signup' || path === '/forgot-password')) {
		throw redirect(302, '/receive');
	}
	return resolve(event);
};

export const handle: Handle = sequence(
	handleAnonymousLocale,
	handleBetterAuth,
	handleUserLocale,
	handleParaglide,
	handleGuards
);
