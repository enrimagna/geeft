import { and, asc, eq } from 'drizzle-orm';
import type { Db } from '$lib/server/db/sqlite';
import { family, familyMember, user } from '$lib/server/db/schema';
import { AppError } from '$lib/server/errors';
import { generateInviteCode, hashInvite } from '$lib/server/invite';
import {
	ensurePersonalList,
	requireMembership,
	setCurrentFamily,
	type AppUser
} from '$lib/server/session';
import type { Locale } from '$lib/i18n/catalog';

export function listFamilies(db: Db, userId: string) {
	return db
		.select({
			id: family.id,
			name: family.name,
			role: familyMember.role,
			joinedAt: familyMember.joinedAt
		})
		.from(familyMember)
		.innerJoin(family, eq(family.id, familyMember.familyId))
		.where(eq(familyMember.userId, userId))
		.all();
}

export function joinFamily(db: Db, appUser: AppUser, code: string, locale: Locale) {
	const trimmed = code.trim();
	if (!trimmed) throw new AppError(422, 'auth.invite.required', locale);
	const fam = db
		.select()
		.from(family)
		.where(eq(family.inviteCodeHash, hashInvite(trimmed)))
		.get();
	if (!fam) throw new AppError(404, 'auth.invite.invalid', locale);
	const existing = db
		.select()
		.from(familyMember)
		.where(and(eq(familyMember.familyId, fam.id), eq(familyMember.userId, appUser.id)))
		.get();
	if (existing) throw new AppError(409, 'error.unauthorized', locale);
	db.insert(familyMember).values({ familyId: fam.id, userId: appUser.id, role: 'member' }).run();
	ensurePersonalList(db, fam.id, appUser.id, appUser.firstName);
	if (!appUser.currentFamilyId) setCurrentFamily(db, appUser.id, fam.id);
	return fam;
}

export function createFamily(db: Db, appUser: AppUser, name: string, locale: Locale) {
	const familyName = name.trim();
	if (!familyName) throw new AppError(422, 'error.validation', locale);
	const invite = generateInviteCode();
	const id = crypto.randomUUID();
	db.insert(family)
		.values({ id, name: familyName, inviteCodeHash: hashInvite(invite) })
		.run();
	db.insert(familyMember).values({ familyId: id, userId: appUser.id, role: 'owner' }).run();
	ensurePersonalList(db, id, appUser.id, appUser.firstName);
	setCurrentFamily(db, appUser.id, id);
	return { id, name: familyName, inviteCode: invite };
}

export function switchFamily(db: Db, appUser: AppUser, familyId: string) {
	requireMembership(db, appUser.id, familyId);
	setCurrentFamily(db, appUser.id, familyId);
}

export function regenerateInvite(db: Db, appUser: AppUser, familyId: string, locale: Locale) {
	const membership = requireMembership(db, appUser.id, familyId);
	if (membership.role !== 'owner') throw new AppError(403, 'error.unauthorized', locale);
	const invite = generateInviteCode();
	db.update(family)
		.set({ inviteCodeHash: hashInvite(invite) })
		.where(eq(family.id, familyId))
		.run();
	return invite;
}

export function membersOf(db: Db, familyId: string) {
	return db
		.select({
			id: user.id,
			firstName: user.firstName
		})
		.from(familyMember)
		.innerJoin(user, eq(user.id, familyMember.userId))
		.where(eq(familyMember.familyId, familyId))
		.orderBy(asc(user.firstName))
		.all();
}
