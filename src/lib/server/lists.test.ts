import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, expect, it } from 'vitest';
import { createSqlite } from './db/sqlite';
import { family, familyMember, giftList, user } from './db/schema';
import { AppError } from './errors';
import { createOwnGift, listGiveGifts, listReceiveGifts } from './gifts';
import {
	addListAdmin,
	createManagedList,
	giveListsFor,
	receiveListsFor,
	setListShares
} from './lists';

function setup() {
	mkdirSync(join(tmpdir(), 'geeft-tests'), { recursive: true });
	const url = join(tmpdir(), `geeft-tests/${crypto.randomUUID()}.sqlite`);
	const { db } = createSqlite(url);
	migrate(db, { migrationsFolder: './drizzle' });
	const now = new Date();
	db.insert(user)
		.values([
			{
				id: 'u-lucile',
				name: 'Lucile',
				email: 'lucile@test.local',
				emailVerified: true,
				firstName: 'Lucile',
				locale: 'it',
				currentFamilyId: 'fam',
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'u-enrico',
				name: 'Enrico',
				email: 'enrico@test.local',
				emailVerified: true,
				firstName: 'Enrico',
				locale: 'it',
				currentFamilyId: 'fam',
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'u-caroline',
				name: 'Caroline',
				email: 'caroline@test.local',
				emailVerified: true,
				firstName: 'Caroline',
				locale: 'it',
				currentFamilyId: 'fam',
				createdAt: now,
				updatedAt: now
			}
		])
		.run();
	db.insert(family)
		.values({ id: 'fam', name: 'Pétisné', inviteCodeHash: 'hash', createdAt: now })
		.run();
	db.insert(familyMember)
		.values([
			{ familyId: 'fam', userId: 'u-lucile', role: 'member', joinedAt: now },
			{ familyId: 'fam', userId: 'u-enrico', role: 'owner', joinedAt: now },
			{ familyId: 'fam', userId: 'u-caroline', role: 'member', joinedAt: now }
		])
		.run();
	db.insert(giftList)
		.values([
			{
				id: 'list-lucile',
				familyId: 'fam',
				ownerId: 'u-lucile',
				name: 'Lucile',
				isPersonal: true,
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'list-enrico',
				familyId: 'fam',
				ownerId: 'u-enrico',
				name: 'Enrico',
				isPersonal: true,
				createdAt: now,
				updatedAt: now
			},
			{
				id: 'list-caroline',
				familyId: 'fam',
				ownerId: 'u-caroline',
				name: 'Caroline',
				isPersonal: true,
				createdAt: now,
				updatedAt: now
			}
		])
		.run();
	return db;
}

describe('managed lists', () => {
	it('lets co-admins manage Receive and hides the list from their Give', () => {
		const db = setup();
		const alba = createManagedList(db, 'fam', 'u-enrico', 'Alba', 'it');
		addListAdmin(db, alba.id, 'u-enrico', 'u-lucile', 'it');
		createOwnGift(db, {
			listId: alba.id,
			actorId: 'u-lucile',
			familyId: 'fam',
			locale: 'it',
			title: 'Libro illustrato'
		});
		const lucileReceive = listReceiveGifts(db, alba.id, 'u-lucile', 'fam');
		expect(lucileReceive.map((g) => g.title)).toContain('Libro illustrato');
		const enricoReceive = listReceiveGifts(db, alba.id, 'u-enrico', 'fam');
		expect(enricoReceive).toHaveLength(1);
		expect(() => listGiveGifts(db, alba.id, 'u-enrico', 'fam')).toThrow(AppError);
		expect(() => listGiveGifts(db, alba.id, 'u-lucile', 'fam')).toThrow(AppError);
		const carolineGive = listGiveGifts(db, alba.id, 'u-caroline', 'fam');
		expect(carolineGive).toHaveLength(1);
		expect(JSON.stringify(carolineGive)).not.toContain('reservedBy');
		const enricoGiveNames = giveListsFor(db, 'u-enrico', 'fam').map((l) => l.name);
		expect(enricoGiveNames).not.toContain('Alba');
		expect(enricoGiveNames).toContain('Lucile');
		const receiveNames = receiveListsFor(db, 'u-enrico', 'fam', 'Enrico').map((l) => l.name);
		expect(receiveNames).toEqual(['Enrico', 'Alba']);
	});

	it('shows personal gifts in every family and managed lists only where shared', () => {
		const db = setup();
		const now = new Date();
		db.insert(family)
			.values({ id: 'mag', name: 'Magnarello', inviteCodeHash: 'hash2', createdAt: now })
			.run();
		db.insert(familyMember)
			.values([
				{ familyId: 'mag', userId: 'u-enrico', role: 'owner', joinedAt: now },
				{ familyId: 'mag', userId: 'u-caroline', role: 'member', joinedAt: now }
			])
			.run();
		const alba = createManagedList(db, 'fam', 'u-enrico', 'Alba', 'it');
		createManagedList(db, 'fam', 'u-enrico', 'Coppia', 'it');
		expect(receiveListsFor(db, 'u-enrico', 'mag', 'Enrico').map((l) => l.name)).toEqual(['Enrico']);
		expect(giveListsFor(db, 'u-caroline', 'mag').map((l) => l.name)).toContain('Enrico');
		expect(giveListsFor(db, 'u-caroline', 'mag').map((l) => l.name)).not.toContain('Alba');
		setListShares(db, alba.id, 'u-enrico', ['fam', 'mag'], 'it');
		expect(receiveListsFor(db, 'u-enrico', 'mag', 'Enrico').map((l) => l.name)).toEqual([
			'Enrico',
			'Alba'
		]);
		expect(giveListsFor(db, 'u-caroline', 'mag').map((l) => l.name)).toContain('Alba');
		expect(giveListsFor(db, 'u-caroline', 'mag').map((l) => l.name)).not.toContain('Coppia');
		expect(receiveListsFor(db, 'u-enrico', 'fam', 'Enrico').map((l) => l.name)).toEqual([
			'Enrico',
			'Alba',
			'Coppia'
		]);
	});
});
