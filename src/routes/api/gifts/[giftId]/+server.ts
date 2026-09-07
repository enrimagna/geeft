import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { jsonError } from '$lib/server/errors';
import { deleteOwnGift, updateOwnGift } from '$lib/server/gifts';
import { requireCurrentFamily, requireUser } from '$lib/server/session';
import type { RequestHandler } from './$types';

export const PATCH: RequestHandler = async (event) => {
	try {
		const user = requireUser(event);
		const fam = requireCurrentFamily(db, user);
		const body = await event.request.json();
		const gift = updateOwnGift(db, {
			giftId: event.params.giftId,
			actorId: user.id,
			familyId: fam.id,
			locale: user.locale,
			title: body.title,
			description: body.description,
			url: body.url
		});
		return json(gift);
	} catch (error) {
		return jsonError(error);
	}
};

export const DELETE: RequestHandler = async (event) => {
	try {
		const user = requireUser(event);
		const fam = requireCurrentFamily(db, user);
		deleteOwnGift(db, event.params.giftId, user.id, fam.id, user.locale);
		return new Response(null, { status: 204 });
	} catch (error) {
		return jsonError(error);
	}
};
