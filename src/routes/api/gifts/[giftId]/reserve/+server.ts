import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jsonError } from '$lib/server/errors';
import { reserveGift } from '$lib/server/gifts';
import { requireCurrentFamily, requireUser } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async (event) => {
	try {
		const user = requireUser(event);
		const fam = requireCurrentFamily(db, user);
		const gift = reserveGift(db, event.params.giftId, user.id, fam.id, user.locale);
		return json(gift);
	} catch (error) {
		return jsonError(error);
	}
};
