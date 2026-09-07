import type { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Db } from '$lib/server/db/sqlite';
import { family, familyMember, giftList, user } from '$lib/server/db/schema';
import { AppError } from '$lib/server/errors';
import { coerceLocale, type Locale } from '$lib/i18n/catalog';

export type AppUser = {
	id: string;
	email: string;
	name: string;
	firstName: string;
	lastName: string | null;
	locale: Locale;
	currentFamilyId: string | null;
};

export function asAppUser(raw: RequestEvent['locals']['user']): AppUser | null {
	if (!raw) return null;
	const extra = raw as typeof raw & {
		firstName?: string;
		lastName?: string | null;
		locale?: string;
		currentFamilyId?: string | null;
	};
	return {
		id: raw.id,
		email: raw.email,
		name: raw.name,
		firstName: extra.firstName ?? raw.name,
		lastName: extra.lastName ?? null,
		locale: coerceLocale(extra.locale),
		currentFamilyId: extra.currentFamilyId ?? null
	};
}

export function requireUser(event: RequestEvent): AppUser {
	const current = asAppUser(event.locals.user);
	if (!current) throw new AppError(401, 'auth.error');
	return current;
}

export function requirePageUser(event: RequestEvent): AppUser {
	const current = asAppUser(event.locals.user);
	if (!current) throw redirect(302, '/login');
	return current;
}

export function requireMembership(db: Db, userId: string, familyId: string) {
	const row = db
		.select()
		.from(familyMember)
		.where(and(eq(familyMember.userId, userId), eq(familyMember.familyId, familyId)))
		.get();
	if (!row) throw new AppError(403, 'error.unauthorized');
	return row;
}

export function requireCurrentFamily(db: Db, appUser: AppUser) {
	if (!appUser.currentFamilyId) throw new AppError(403, 'error.unauthorized');
	requireMembership(db, appUser.id, appUser.currentFamilyId);
	const fam = db.select().from(family).where(eq(family.id, appUser.currentFamilyId)).get();
	if (!fam) throw new AppError(404, 'error.notFound');
	return fam;
}

export function personalList(db: Db, ownerId: string) {
	const list = db
		.select()
		.from(giftList)
		.where(and(eq(giftList.ownerId, ownerId), eq(giftList.isPersonal, true)))
		.get();
	if (!list) throw new AppError(404, 'error.notFound');
	return list;
}

export function setCurrentFamily(db: Db, userId: string, familyId: string) {
	db.update(user)
		.set({ currentFamilyId: familyId, updatedAt: new Date() })
		.where(eq(user.id, userId))
		.run();
}

export function ensurePersonalList(db: Db, familyId: string, ownerId: string, name: string) {
	const existing = db
		.select()
		.from(giftList)
		.where(and(eq(giftList.ownerId, ownerId), eq(giftList.isPersonal, true)))
		.get();
	if (existing) return existing;
	const id = crypto.randomUUID();
	db.insert(giftList)
		.values({
			id,
			familyId,
			ownerId,
			name,
			isPersonal: true
		})
		.run();
	return db.select().from(giftList).where(eq(giftList.id, id)).get()!;
}
