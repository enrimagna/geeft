import { sequence } from '@sveltejs/kit/hooks';
import { building } from '$app/environment';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import type { Handle } from '@sveltejs/kit';
import { getTextDirection } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { json, redirect } from '@sveltejs/kit';

const handleParaglide: Handle = ({ event, resolve }) =>
	paraglideMiddleware(event.request, ({ request, locale }) => {
		event.request = request;
		return resolve(event, {
			transformPageChunk: ({ html }) =>
				html
					.replace('%paraglide.lang%', locale)
					.replace('%paraglide.dir%', getTextDirection(locale))
		});
	});

const handleBetterAuth: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({ headers: event.request.headers });
	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}
	return svelteKitHandler({ event, resolve, auth, building });
};

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

export const handle: Handle = sequence(handleParaglide, handleBetterAuth, handleGuards);
