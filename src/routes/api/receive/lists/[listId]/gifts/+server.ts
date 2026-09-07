import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jsonError } from '$lib/server/errors';
import { listReceiveGifts } from '$lib/server/gifts';
import { requireCurrentFamily, requireUser } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	try {
		const user = requireUser(event);
		const fam = requireCurrentFamily(db, user);
		const gifts = listReceiveGifts(db, event.params.listId, user.id, fam.id);
		return json(gifts);
	} catch (error) {
		return jsonError(error);
	}
};
