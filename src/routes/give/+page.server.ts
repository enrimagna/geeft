import { db } from '$lib/server/db';
import { actionFail } from '$lib/server/errors';
import { giveListsFor } from '$lib/server/lists';
import {
	addComment,
	createSecretGift,
	deleteComment,
	listComments,
	listGiveGifts,
	markSecretDelivered,
	reserveGift,
	unreserveGift,
	withdrawSecret
} from '$lib/server/gifts';
import { requireCurrentFamily, requirePageUser } from '$lib/server/session';
import { AppError } from '$lib/server/errors';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requirePageUser(event);
	const fam = requireCurrentFamily(db, user);
	const lists = giveListsFor(db, user.id, fam.id);
	const selected = event.url.searchParams.get('list') ?? lists[0]?.listId ?? null;
	const gifts = selected ? listGiveGifts(db, selected, user.id, fam.id) : [];
	const giftId = event.url.searchParams.get('gift');
	const stillThere = giftId ? gifts.some((g) => g.id === giftId) : false;
	let comments: ReturnType<typeof listComments> = [];
	if (giftId && selected && stillThere) {
		try {
			comments = listComments(db, giftId, user.id, fam.id, user.locale);
		} catch (error) {
			if (!(error instanceof AppError && error.status === 404)) throw error;
		}
	}
	return {
		familyName: fam.name,
		lists,
		selected,
		gifts,
		comments,
		giftId: stillThere ? giftId : null
	};
};

export const actions: Actions = {
	reserve: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			reserveGift(db, form.get('giftId')?.toString() ?? '', user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	unreserve: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			unreserveGift(db, form.get('giftId')?.toString() ?? '', user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	secret: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			createSecretGift(db, {
				listId: form.get('listId')?.toString() ?? '',
				giverId: user.id,
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
	withdraw: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			withdrawSecret(db, form.get('giftId')?.toString() ?? '', user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	deliver: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			markSecretDelivered(db, form.get('giftId')?.toString() ?? '', user.id, fam.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	comment: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			addComment(
				db,
				form.get('giftId')?.toString() ?? '',
				user.id,
				fam.id,
				user.locale,
				form.get('body')?.toString() ?? ''
			);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	deleteComment: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			deleteComment(db, form.get('commentId')?.toString() ?? '', user.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	}
};
