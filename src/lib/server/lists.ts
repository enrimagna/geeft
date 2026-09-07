import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Db } from '$lib/server/db/sqlite';
import { family, familyMember, giftList, listAdmin, listFamily, user } from '$lib/server/db/schema';
import { AppError } from '$lib/server/errors';
import { requireMembership } from '$lib/server/session';
import type { Locale } from '$lib/i18n/catalog';

export function isListAdmin(db: Db, listId: string, userId: string): boolean {
	return Boolean(
		db
			.select()
			.from(listAdmin)
			.where(and(eq(listAdmin.listId, listId), eq(listAdmin.userId, userId)))
			.get()
	);
}

export function isSharedTo(db: Db, listId: string, familyId: string): boolean {
	return Boolean(
		db
			.select()
			.from(listFamily)
			.where(and(eq(listFamily.listId, listId), eq(listFamily.familyId, familyId)))
			.get()
	);
}

export function canManageList(
	db: Db,
	list: { id: string; ownerId: string; isPersonal: boolean },
	userId: string
): boolean {
	if (list.isPersonal) return list.ownerId === userId;
	return isListAdmin(db, list.id, userId);
}

function personalVisibleInFamily(db: Db, ownerId: string, familyId: string): boolean {
	return Boolean(
		db
			.select()
			.from(familyMember)
			.where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, ownerId)))
			.get()
	);
}

export function requireManageableList(
	db: Db,
	listId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	const list = db.select().from(giftList).where(eq(giftList.id, listId)).get();
	if (!list) throw new AppError(404, 'error.notFound', locale);
	if (!canManageList(db, list, userId)) throw new AppError(404, 'error.notFound', locale);
	if (list.isPersonal) {
		requireMembership(db, userId, familyId);
		return list;
	}
	if (!isSharedTo(db, list.id, familyId)) throw new AppError(404, 'error.notFound', locale);
	return list;
}

export function requireGiveList(
	db: Db,
	listId: string,
	userId: string,
	familyId: string,
	locale: Locale
) {
	const list = db.select().from(giftList).where(eq(giftList.id, listId)).get();
	if (!list) throw new AppError(404, 'error.notFound', locale);
	if (canManageList(db, list, userId)) throw new AppError(404, 'error.notFound', locale);
	if (list.isPersonal) {
		if (!personalVisibleInFamily(db, list.ownerId, familyId)) {
			throw new AppError(404, 'error.notFound', locale);
		}
		return list;
	}
	if (!isSharedTo(db, list.id, familyId)) throw new AppError(404, 'error.notFound', locale);
	return list;
}

export function managedListsFor(db: Db, userId: string, familyId: string) {
	return db
		.select({
			id: giftList.id,
			name: giftList.name,
			ownerId: giftList.ownerId,
			isPersonal: giftList.isPersonal
		})
		.from(listAdmin)
		.innerJoin(giftList, eq(giftList.id, listAdmin.listId))
		.innerJoin(listFamily, eq(listFamily.listId, giftList.id))
		.where(
			and(
				eq(listAdmin.userId, userId),
				eq(listFamily.familyId, familyId),
				eq(giftList.isPersonal, false)
			)
		)
		.orderBy(asc(giftList.name))
		.all();
}

export function allManagedListsFor(db: Db, userId: string) {
	return db
		.select({
			id: giftList.id,
			name: giftList.name,
			ownerId: giftList.ownerId,
			isPersonal: giftList.isPersonal
		})
		.from(listAdmin)
		.innerJoin(giftList, eq(giftList.id, listAdmin.listId))
		.where(and(eq(listAdmin.userId, userId), eq(giftList.isPersonal, false)))
		.orderBy(asc(giftList.name))
		.all();
}

export function receiveListsFor(db: Db, userId: string, familyId: string, firstName: string) {
	const personal = db
		.select()
		.from(giftList)
		.where(and(eq(giftList.ownerId, userId), eq(giftList.isPersonal, true)))
		.get();
	const managed = managedListsFor(db, userId, familyId);
	const lists: { listId: string; name: string; kind: 'personal' | 'managed' }[] = [];
	if (personal) lists.push({ listId: personal.id, name: firstName, kind: 'personal' });
	for (const item of managed) lists.push({ listId: item.id, name: item.name, kind: 'managed' });
	return lists;
}

export function giveListsFor(db: Db, userId: string, familyId: string) {
	const memberIds = db
		.select({ userId: familyMember.userId })
		.from(familyMember)
		.where(eq(familyMember.familyId, familyId))
		.all()
		.map((row) => row.userId)
		.filter((id) => id !== userId);

	const personal =
		memberIds.length === 0
			? []
			: db
					.select()
					.from(giftList)
					.where(and(eq(giftList.isPersonal, true), inArray(giftList.ownerId, memberIds)))
					.orderBy(asc(giftList.name))
					.all();

	const managed = db
		.select({
			id: giftList.id,
			name: giftList.name,
			ownerId: giftList.ownerId,
			isPersonal: giftList.isPersonal,
			familyId: giftList.familyId
		})
		.from(giftList)
		.innerJoin(listFamily, eq(listFamily.listId, giftList.id))
		.where(and(eq(giftList.isPersonal, false), eq(listFamily.familyId, familyId)))
		.orderBy(asc(giftList.name))
		.all();

	return [
		...personal.map((list) => ({
			listId: list.id,
			name: list.name,
			kind: 'personal' as const
		})),
		...managed
			.filter((list) => !canManageList(db, list, userId))
			.map((list) => ({
				listId: list.id,
				name: list.name,
				kind: 'managed' as const
			}))
	];
}

export function createManagedList(
	db: Db,
	familyId: string,
	creatorId: string,
	name: string,
	locale: Locale
) {
	const listName = name.trim();
	if (!listName) throw new AppError(422, 'error.validation', locale);
	requireMembership(db, creatorId, familyId);
	const duplicate = db
		.select()
		.from(giftList)
		.where(
			and(
				eq(giftList.familyId, familyId),
				eq(giftList.name, listName),
				eq(giftList.isPersonal, false)
			)
		)
		.get();
	if (duplicate) throw new AppError(409, 'lists.duplicate', locale);
	const id = crypto.randomUUID();
	db.insert(giftList)
		.values({
			id,
			familyId,
			ownerId: creatorId,
			name: listName,
			isPersonal: false
		})
		.run();
	db.insert(listAdmin).values({ listId: id, userId: creatorId }).run();
	db.insert(listFamily).values({ listId: id, familyId }).run();
	return db.select().from(giftList).where(eq(giftList.id, id)).get()!;
}

export function sharesOf(db: Db, listId: string) {
	return db
		.select({
			id: family.id,
			name: family.name
		})
		.from(listFamily)
		.innerJoin(family, eq(family.id, listFamily.familyId))
		.where(eq(listFamily.listId, listId))
		.orderBy(asc(family.name))
		.all();
}

export function setListShares(
	db: Db,
	listId: string,
	actorId: string,
	familyIds: string[],
	locale: Locale
) {
	const list = db.select().from(giftList).where(eq(giftList.id, listId)).get();
	if (!list || list.isPersonal) throw new AppError(404, 'error.notFound', locale);
	if (!isListAdmin(db, listId, actorId)) throw new AppError(404, 'error.notFound', locale);
	const unique = [...new Set(familyIds.map((id) => id.trim()).filter(Boolean))];
	if (unique.length === 0) throw new AppError(422, 'lists.needFamily', locale);
	for (const familyId of unique) {
		requireMembership(db, actorId, familyId);
	}
	db.delete(listFamily).where(eq(listFamily.listId, listId)).run();
	for (const familyId of unique) {
		db.insert(listFamily).values({ listId, familyId }).run();
	}
}

export function familiesOfUser(db: Db, userId: string) {
	return db
		.select({
			id: family.id,
			name: family.name
		})
		.from(familyMember)
		.innerJoin(family, eq(family.id, familyMember.familyId))
		.where(eq(familyMember.userId, userId))
		.orderBy(asc(family.name))
		.all();
}

export function adminsOf(db: Db, listId: string) {
	return db
		.select({
			id: user.id,
			firstName: user.firstName
		})
		.from(listAdmin)
		.innerJoin(user, eq(user.id, listAdmin.userId))
		.where(eq(listAdmin.listId, listId))
		.orderBy(asc(user.firstName))
		.all();
}

function inviteeCanJoin(db: Db, listId: string, inviteeId: string): boolean {
	const shares = db.select().from(listFamily).where(eq(listFamily.listId, listId)).all();
	return shares.some((share) =>
		Boolean(
			db
				.select()
				.from(familyMember)
				.where(and(eq(familyMember.familyId, share.familyId), eq(familyMember.userId, inviteeId)))
				.get()
		)
	);
}

export function requireAdminOfManaged(db: Db, listId: string, actorId: string, locale: Locale) {
	const list = db.select().from(giftList).where(eq(giftList.id, listId)).get();
	if (!list || list.isPersonal) throw new AppError(404, 'error.notFound', locale);
	if (!isListAdmin(db, listId, actorId)) throw new AppError(404, 'error.notFound', locale);
	return list;
}

export function addListAdmin(
	db: Db,
	listId: string,
	actorId: string,
	inviteeId: string,
	locale: Locale
) {
	requireAdminOfManaged(db, listId, actorId, locale);
	if (inviteeId === actorId) throw new AppError(422, 'error.validation', locale);
	if (!inviteeCanJoin(db, listId, inviteeId)) throw new AppError(403, 'error.unauthorized', locale);
	if (isListAdmin(db, listId, inviteeId)) throw new AppError(409, 'lists.alreadyAdmin', locale);
	db.insert(listAdmin).values({ listId, userId: inviteeId }).run();
}

export function removeListAdmin(
	db: Db,
	listId: string,
	actorId: string,
	removeId: string,
	locale: Locale
) {
	requireAdminOfManaged(db, listId, actorId, locale);
	const admins = adminsOf(db, listId);
	if (admins.length <= 1) throw new AppError(409, 'lists.lastAdmin', locale);
	if (!isListAdmin(db, listId, removeId)) throw new AppError(404, 'error.notFound', locale);
	db.delete(listAdmin)
		.where(and(eq(listAdmin.listId, listId), eq(listAdmin.userId, removeId)))
		.run();
}

export function deleteManagedList(db: Db, listId: string, actorId: string, locale: Locale) {
	requireAdminOfManaged(db, listId, actorId, locale);
	db.delete(giftList).where(eq(giftList.id, listId)).run();
}

export function membersForListInvite(db: Db, listId: string, actorId: string) {
	const shares = db.select().from(listFamily).where(eq(listFamily.listId, listId)).all();
	const seen = new Set<string>();
	const members: { id: string; firstName: string }[] = [];
	for (const share of shares) {
		const rows = db
			.select({ id: user.id, firstName: user.firstName })
			.from(familyMember)
			.innerJoin(user, eq(user.id, familyMember.userId))
			.where(eq(familyMember.familyId, share.familyId))
			.all();
		for (const row of rows) {
			if (row.id === actorId || seen.has(row.id)) continue;
			seen.add(row.id);
			members.push(row);
		}
	}
	return members.sort((a, b) => a.firstName.localeCompare(b.firstName, 'fr'));
}
