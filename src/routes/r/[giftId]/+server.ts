import { error, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { gift } from '$lib/server/db/schema';
import {
	canAccessGiftRedirect,
	checkRedirectRateLimit,
	hashUserAgent,
	isAffiliateEnabled,
	loadEnabledNetworks,
	logAffiliateClick,
	rewriteAffiliateUrl
} from '$lib/server/affiliate';
import { asAppUser } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const user = asAppUser(event.locals.user);
	if (!user) throw error(401, 'Unauthorized');

	const giftId = event.params.giftId?.trim();
	if (!giftId) throw error(404, 'Not found');

	// Open-redirect guard: never read destination from query string.
	void event.url.searchParams;

	if (!checkRedirectRateLimit(user.id)) throw error(429, 'Too many requests');

	if (!canAccessGiftRedirect(db, giftId, user.id)) throw error(404, 'Not found');

	const row = db.select().from(gift).where(eq(gift.id, giftId)).get();
	if (!row?.url) throw error(404, 'Not found');

	const enabled = isAffiliateEnabled(db);
	const networks = enabled ? loadEnabledNetworks(db) : [];
	const rewritten = rewriteAffiliateUrl(row.url, networks, {
		enabled,
		locale: user.locale
	});

	logAffiliateClick(db, {
		giftId: row.id,
		userId: user.id,
		networkId: rewritten.networkId,
		originalHost: rewritten.host || 'unknown',
		rewritten: rewritten.rewritten,
		uaHash: hashUserAgent(event.request.headers.get('user-agent'))
	});

	throw redirect(302, rewritten.url || row.url);
};
