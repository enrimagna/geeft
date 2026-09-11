import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { actionFail, AppError } from '$lib/server/errors';
import {
	createOwnGift,
	deleteOwnGift,
	listReceiveGifts,
	markReceived,
	unmarkReceived,
	updateOwnGift
} from '$lib/server/gifts';
import { requireCurrentFamily, requirePageUser } from '$lib/server/session';
import { receiveListsFor } from '$lib/server/lists';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requirePageUser(event);
	const fam = requireCurrentFamily(db, user);
	const lists = receiveListsFor(db, user.id, fam.id, user.firstName);
	const selected =
		event.url.searchParams.get('list') ??
		lists.find((l) => l.kind === 'personal')?.listId ??
		lists[0]?.listId ??
		null;
	let gifts: ReturnType<typeof listReceiveGifts> = [];
	if (selected) {
		try {
			gifts = listReceiveGifts(db, selected, user.id, fam.id);
		} catch (error) {
			if (!(error instanceof AppError)) throw error;
			selected = lists[0]?.listId ?? null;
			gifts = selected ? listReceiveGifts(db, selected, user.id, fam.id) : [];
		}
	}
	return { lists, selected, gifts };
};

export const actions: Actions = {
	create: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			createOwnGift(db, {
				listId: form.get('listId')?.toString() ?? '',
				actorId: user.id,
				familyId: fam.id,
				locale: user.locale,
				title: form.get('title')?.toString() ?? '',
				description: form.get('description')?.toString(),
				url: form.get('url')?.toString()
			});
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	update: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			updateOwnGift(db, {
				giftId: form.get('giftId')?.toString() ?? '',
				actorId: user.id,
				familyId: fam.id,
				locale: user.locale,
				title: form.get('title')?.toString(),
				description: form.get('description')?.toString(),
				url: form.get('url')?.toString()
			});
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	delete: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			const giftId = form.get('giftId')?.toString() ?? '';
			if (!giftId) return fail(422, { message: 'missing' });
			deleteOwnGift(db, giftId, user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	received: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			markReceived(db, form.get('giftId')?.toString() ?? '', user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	unreceived: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			unmarkReceived(db, form.get('giftId')?.toString() ?? '', user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	}
};
