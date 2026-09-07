import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { describe, expect, it } from 'vitest';
import { createSqlite } from './db/sqlite';
import { family, familyMember, giftList, user } from './db/schema';
import { AppError } from './errors';
import {
	createOwnGift,
	createSecretGift,
	deleteOwnGift,
	listGiveGifts,
	listReceiveGifts,
	reserveGift,
	unreserveGift,
	updateOwnGift,
	withdrawSecret
} from './gifts';
import { t } from '$lib/i18n/catalog';

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
			}
		])
		.run();
	db.insert(family)
		.values({ id: 'fam', name: 'Familia', inviteCodeHash: 'hash', createdAt: now })
		.run();
	db.insert(familyMember)
		.values([
			{ familyId: 'fam', userId: 'u-lucile', role: 'member', joinedAt: now },
			{ familyId: 'fam', userId: 'u-enrico', role: 'owner', joinedAt: now }
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
			}
		])
		.run();
	return db;
}

describe('privacy and reservations', () => {
	it('omits secrets and reservation identity from Receive', () => {
		const db = setup();
		createOwnGift(db, {
			listId: 'list-lucile',
			actorId: 'u-lucile',
			familyId: 'fam',
			locale: 'it',
			title: 'Taccuino'
		});
		createSecretGift(db, {
			listId: 'list-lucile',
			giverId: 'u-enrico',
			familyId: 'fam',
			locale: 'it',
			title: 'Weekend'
		});
		const receive = listReceiveGifts(db, 'list-lucile', 'u-lucile', 'fam');
		expect(receive).toHaveLength(1);
		expect(receive[0].title).toBe('Taccuino');
		expect(JSON.stringify(receive)).not.toContain('reserved');
		expect(JSON.stringify(receive)).not.toContain('Weekend');
		const give = listGiveGifts(db, 'list-lucile', 'u-enrico', 'fam');
		expect(give.some((g) => g.hiddenFromRecipient && g.reservation === 'none')).toBe(true);
		expect(give.every((g) => !('reservedBy' in g))).toBe(true);
	});

	it('does not auto-reserve a secret gift', () => {
		const db = setup();
		const secret = createSecretGift(db, {
			listId: 'list-lucile',
			giverId: 'u-enrico',
			familyId: 'fam',
			locale: 'it',
			title: 'Sorpresa'
		});
		expect(secret.reservation).toBe('none');
		expect(secret.hiddenFromRecipient).toBe(true);
		const reserved = reserveGift(db, secret.id, 'u-enrico', 'fam', 'it');
		expect(reserved.reservation).toBe('mine');
		const free = unreserveGift(db, secret.id, 'u-enrico', 'fam', 'it');
		expect(free.reservation).toBe('none');
		withdrawSecret(db, secret.id, 'u-enrico', 'fam', 'it');
		expect(
			listGiveGifts(db, 'list-lucile', 'u-enrico', 'fam').every((g) => g.id !== secret.id)
		).toBe(true);
	});

	it('reserves atomically and returns 409 on conflict', () => {
		const db = setup();
		const idea = createOwnGift(db, {
			listId: 'list-lucile',
			actorId: 'u-lucile',
			familyId: 'fam',
			locale: 'it',
			title: 'Cuffie'
		});
		const first = reserveGift(db, idea.id, 'u-enrico', 'fam', 'it');
		expect(first.reservation).toBe('mine');
		try {
			reserveGift(db, idea.id, 'u-enrico', 'fam', 'it');
			expect.unreachable('second reserve should fail');
		} catch (error) {
			expect(error).toBeInstanceOf(AppError);
			expect((error as AppError).status).toBe(409);
		}
	});

	it('blocks delete and edit of reserved ideas with localized 409', () => {
		const db = setup();
		const idea = createOwnGift(db, {
			listId: 'list-lucile',
			actorId: 'u-lucile',
			familyId: 'fam',
			locale: 'it',
			title: 'Sciarpa'
		});
		reserveGift(db, idea.id, 'u-enrico', 'fam', 'it');
		try {
			deleteOwnGift(db, idea.id, 'u-lucile', 'fam', 'it');
			expect.unreachable();
		} catch (error) {
			expect((error as AppError).status).toBe(409);
			expect((error as AppError).message).toBe(t('it', 'gift.delete.reserved'));
		}
		try {
			updateOwnGift(db, {
				giftId: idea.id,
				actorId: 'u-lucile',
				familyId: 'fam',
				locale: 'it',
				title: 'Altro'
			});
			expect.unreachable();
		} catch (error) {
			expect((error as AppError).status).toBe(409);
		}
	});

	it('does not let a recipient browse own list in Give', () => {
		const db = setup();
		expect(() => listGiveGifts(db, 'list-lucile', 'u-lucile', 'fam')).toThrow(AppError);
	});
});
