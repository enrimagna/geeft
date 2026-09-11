import { and, asc, eq, isNotNull, isNull } from 'drizzle-orm';
import type { Db } from '$lib/server/db/sqlite';
import { gift, giftComment } from '$lib/server/db/schema';
import { AppError } from '$lib/server/errors';
import type { Locale } from '$lib/i18n/catalog';
import { toGiveGift, toReceiveGift } from '$lib/server/visibility';
import { requireGiveList, requireManageableList } from '$lib/server/lists';

function httpsUrl(url: string | null | undefined, locale: Locale) {
	const value = url?.trim() || null;
	if (!value) return null;
	try {
		const parsed = new URL(value);
		if (parsed.protocol !== 'https:') throw new AppError(422, 'error.validation', locale);
		return parsed.toString();
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(422, 'error.validation', locale);
	}
}

export function listReceiveGifts(db: Db, listId: string, actorId: string, familyId: string) {
	requireManageableList(db, listId, actorId, familyId, 'it');
	const rows = db
		.select()
		.from(gift)
		.where(and(eq(gift.listId, listId), eq(gift.hiddenFromRecipient, false)))
		.orderBy(asc(gift.createdAt), asc(gift.id))
		.all();
	return rows.map(toReceiveGift);
}

export function listGiveGifts(db: Db, listId: string, viewerId: string, familyId: string) {
	requireGiveList(db, listId, viewerId, familyId, 'it');
	const rows = db
		.select()
		.from(gift)
		.where(eq(gift.listId, listId))
		.orderBy(asc(gift.createdAt), asc(gift.id))
		.all();
	return rows.map((row) => toGiveGift(row, viewerId));
}

export function createOwnGift(
	db: Db,
	input: {
		listId: string;
		actorId: string;
		familyId: string;
		locale: Locale;
		title: string;
		description?: string | null;
		url?: string | null;
	}
) {
	const list = requireManageableList(db, input.listId, input.actorId, input.familyId, input.locale);
	const title = input.title.trim();
	if (!title) throw new AppError(422, 'error.validation', input.locale);
	const id = crypto.randomUUID();
	db.insert(gift)
		.values({
			id,
			listId: list.id,
			createdBy: input.actorId,
			title,
			description: input.description?.trim() || null,
			url: httpsUrl(input.url, input.locale),
			hiddenFromRecipient: false
		})
		.run();
	return toReceiveGift(db.select().from(gift).where(eq(gift.id, id)).get()!);
}

export function updateOwnGift(
	db: Db,
	input: {
		giftId: string;
		actorId: string;
		familyId: string;
		locale: Locale;
		title?: string;
		description?: string | null;
		url?: string | null;
	}
) {
	const row = loadOwnedGift(db, input.giftId, input.actorId, input.familyId, input.locale);
	if (row.reservedBy) throw new AppError(409, 'gift.edit.reserved', input.locale);
	const title = input.title?.trim() ?? row.title;
	if (!title) throw new AppError(422, 'error.validation', input.locale);
	db.update(gift)
		.set({
			title,
			description:
				input.description === undefined ? row.description : input.description?.trim() || null,
			url: input.url === undefined ? row.url : httpsUrl(input.url, input.locale),
			updatedAt: new Date()
		})
		.where(eq(gift.id, row.id))
		.run();
	return toReceiveGift(db.select().from(gift).where(eq(gift.id, row.id)).get()!);
}

export function deleteOwnGift(
	db: Db,
	giftId: string,
	actorId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadOwnedGift(db, giftId, actorId, familyId, locale);
	const deleted = db
		.delete(gift)
		.where(and(eq(gift.id, row.id), isNull(gift.reservedBy)))
		.run();
	if (deleted.changes === 0) throw new AppError(409, 'gift.delete.reserved', locale);
}

export function markReceived(
	db: Db,
	giftId: string,
	actorId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadOwnedGift(db, giftId, actorId, familyId, locale);
	if (row.hiddenFromRecipient) throw new AppError(404, 'error.notFound', locale);
	db.update(gift)
		.set({ receivedAt: new Date(), updatedAt: new Date() })
		.where(eq(gift.id, row.id))
		.run();
	return toReceiveGift(db.select().from(gift).where(eq(gift.id, row.id)).get()!);
}

export function unmarkReceived(
	db: Db,
	giftId: string,
	actorId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadOwnedGift(db, giftId, actorId, familyId, locale);
	const updated = db
		.update(gift)
		.set({ receivedAt: null, updatedAt: new Date() })
		.where(and(eq(gift.id, row.id), isNotNull(gift.receivedAt)))
		.run();
	if (updated.changes === 0) throw new AppError(409, 'error.validation', locale);
	return toReceiveGift(db.select().from(gift).where(eq(gift.id, row.id)).get()!);
}

export function reserveGift(
	db: Db,
	giftId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadGiveGift(db, giftId, userId, familyId, locale);
	const updated = db
		.update(gift)
		.set({ reservedBy: userId, reservedAt: new Date(), updatedAt: new Date() })
		.where(and(eq(gift.id, row.id), isNull(gift.reservedBy), isNull(gift.receivedAt)))
		.run();
	if (updated.changes === 0) throw new AppError(409, 'gift.reserve.conflict', locale);
	return toGiveGift(db.select().from(gift).where(eq(gift.id, row.id)).get()!, userId);
}

export function unreserveGift(
	db: Db,
	giftId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadGiveGift(db, giftId, userId, familyId, locale);
	const updated = db
		.update(gift)
		.set({ reservedBy: null, reservedAt: null, updatedAt: new Date() })
		.where(and(eq(gift.id, row.id), eq(gift.reservedBy, userId), isNull(gift.receivedAt)))
		.run();
	if (updated.changes === 0) throw new AppError(409, 'gift.reserve.conflict', locale);
	return toGiveGift(db.select().from(gift).where(eq(gift.id, row.id)).get()!, userId);
}

export function createSecretGift(
	db: Db,
	input: {
		listId: string;
		giverId: string;
		familyId: string;
		locale: Locale;
		title: string;
		description?: string | null;
		url?: string | null;
	}
) {
	requireGiveList(db, input.listId, input.giverId, input.familyId, input.locale);
	const title = input.title.trim();
	if (!title) throw new AppError(422, 'error.validation', input.locale);
	const id = crypto.randomUUID();
	db.insert(gift)
		.values({
			id,
			listId: input.listId,
			createdBy: input.giverId,
			title,
			description: input.description?.trim() || null,
			url: httpsUrl(input.url, input.locale),
			hiddenFromRecipient: true
		})
		.run();
	return toGiveGift(db.select().from(gift).where(eq(gift.id, id)).get()!, input.giverId);
}

export function withdrawSecret(
	db: Db,
	giftId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadGiveGift(db, giftId, userId, familyId, locale);
	if (!row.hiddenFromRecipient || row.createdBy !== userId) {
		throw new AppError(403, 'error.unauthorized', locale);
	}
	db.delete(gift).where(eq(gift.id, row.id)).run();
}

export function markSecretDelivered(
	db: Db,
	giftId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	const row = loadGiveGift(db, giftId, userId, familyId, locale);
	if (!row.hiddenFromRecipient || row.createdBy !== userId) {
		throw new AppError(403, 'error.unauthorized', locale);
	}
	db.update(gift)
		.set({ receivedAt: new Date(), updatedAt: new Date() })
		.where(eq(gift.id, row.id))
		.run();
	return toGiveGift(db.select().from(gift).where(eq(gift.id, row.id)).get()!, userId);
}

export function listComments(
	db: Db,
	giftId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	loadGiveGift(db, giftId, userId, familyId, locale);
	return db
		.select()
		.from(giftComment)
		.where(eq(giftComment.giftId, giftId))
		.orderBy(asc(giftComment.createdAt), asc(giftComment.id))
		.all()
		.map((row) => ({
			id: row.id,
			body: row.body,
			createdAt: row.createdAt,
			mine: row.authorId === userId
		}));
}

export function addComment(
	db: Db,
	giftId: string,
	userId: string,
	familyId: string,
	locale: Locale,
	body: string
) {
	loadGiveGift(db, giftId, userId, familyId, locale);
	const text = body.trim();
	if (!text) throw new AppError(422, 'error.validation', locale);
	const id = crypto.randomUUID();
	db.insert(giftComment).values({ id, giftId, authorId: userId, body: text }).run();
	return { id, body: text, createdAt: new Date(), mine: true };
}

export function deleteComment(db: Db, commentId: string, userId: string, locale: Locale) {
	const row = db.select().from(giftComment).where(eq(giftComment.id, commentId)).get();
	if (!row) throw new AppError(404, 'error.notFound', locale);
	if (row.authorId !== userId) throw new AppError(403, 'error.unauthorized', locale);
	db.delete(giftComment).where(eq(giftComment.id, commentId)).run();
}

function loadOwnedGift(db: Db, giftId: string, actorId: string, familyId: string, locale: Locale) {
	const row = db.select().from(gift).where(eq(gift.id, giftId)).get();
	if (!row) throw new AppError(404, 'error.notFound', locale);
	requireManageableList(db, row.listId, actorId, familyId, locale);
	if (row.hiddenFromRecipient) throw new AppError(404, 'error.notFound', locale);
	return row;
}

function loadGiveGift(db: Db, giftId: string, viewerId: string, familyId: string, locale: Locale) {
	const row = db.select().from(gift).where(eq(gift.id, giftId)).get();
	if (!row) throw new AppError(404, 'error.notFound', locale);
	requireGiveList(db, row.listId, viewerId, familyId, locale);
	return row;
}
