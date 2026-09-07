import { eq } from 'drizzle-orm';
import { hashPassword } from 'better-auth/crypto';
import { createSqlite } from './db/sqlite.ts';
import {
	account,
	family,
	familyMember,
	gift,
	giftComment,
	giftList,
	listAdmin,
	listFamily,
	user
} from './db/schema.ts';
import { DEV_INVITE_CODE, hashInvite } from './invite.ts';

const IDS = {
	familia: '11111111-1111-4111-8111-111111111111',
	lucile: '22222222-2222-4222-8222-222222222222',
	enrico: '33333333-3333-4333-8333-333333333333',
	caroline: '44444444-4444-4444-8444-444444444444',
	helene: 'aaaa1111-1111-4111-8111-111111111111',
	thomas: 'bbbb1111-1111-4111-8111-111111111111',
	isabelle: 'cccc1111-1111-4111-8111-111111111111',
	christian: 'dddd1111-1111-4111-8111-111111111111',
	jeremy: 'eeee1111-1111-4111-8111-111111111111',
	listLucile: '55555555-5555-4555-8555-555555555555',
	listEnrico: '66666666-6666-4666-8666-666666666666',
	listCaroline: '77777777-7777-4777-8777-777777777777',
	listHelene: 'aaaa5555-5555-4555-8555-555555555555',
	listThomas: 'bbbb5555-5555-4555-8555-555555555555',
	listIsabelle: 'cccc5555-5555-4555-8555-555555555555',
	listChristian: 'dddd5555-5555-4555-8555-555555555555',
	listJeremy: 'eeee5555-5555-4555-8555-555555555555',
	listAlba: 'ffff5555-5555-4555-8555-555555555555'
};

export { IDS, DEV_INVITE_CODE };

const FAMILY_NAME = 'Pétisné';

export async function seedDatabase(databaseUrl = process.env.DATABASE_URL ?? 'data/geeft.sqlite') {
	const { db } = createSqlite(databaseUrl);
	const password = await hashPassword('geeft123');
	const now = new Date();

	const people: {
		id: string;
		firstName: string;
		email: string;
		locale: 'it' | 'fr';
		listId: string;
	}[] = [
		{
			id: IDS.lucile,
			firstName: 'Lucile',
			email: 'lucile@geeft.local',
			locale: 'it',
			listId: IDS.listLucile
		},
		{
			id: IDS.enrico,
			firstName: 'Enrico',
			email: 'enrico@geeft.local',
			locale: 'it',
			listId: IDS.listEnrico
		},
		{
			id: IDS.caroline,
			firstName: 'Caroline',
			email: 'caroline@geeft.local',
			locale: 'it',
			listId: IDS.listCaroline
		},
		{
			id: IDS.helene,
			firstName: 'Hélène',
			email: 'helene@geeft.local',
			locale: 'fr',
			listId: IDS.listHelene
		},
		{
			id: IDS.thomas,
			firstName: 'Thomas',
			email: 'thomas@geeft.local',
			locale: 'fr',
			listId: IDS.listThomas
		},
		{
			id: IDS.isabelle,
			firstName: 'Isabelle',
			email: 'isabelle@geeft.local',
			locale: 'fr',
			listId: IDS.listIsabelle
		},
		{
			id: IDS.christian,
			firstName: 'Christian',
			email: 'christian@geeft.local',
			locale: 'fr',
			listId: IDS.listChristian
		},
		{
			id: IDS.jeremy,
			firstName: 'Jérémy',
			email: 'jeremy@geeft.local',
			locale: 'fr',
			listId: IDS.listJeremy
		}
	];

	db.insert(family)
		.values({
			id: IDS.familia,
			name: FAMILY_NAME,
			inviteCodeHash: hashInvite(DEV_INVITE_CODE),
			createdAt: now
		})
		.onConflictDoNothing()
		.run();
	db.update(family).set({ name: FAMILY_NAME }).where(eq(family.id, IDS.familia)).run();

	for (const person of people) {
		db.insert(user)
			.values({
				id: person.id,
				name: person.firstName,
				email: person.email,
				emailVerified: true,
				firstName: person.firstName,
				lastName: null,
				locale: person.locale,
				currentFamilyId: IDS.familia,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoNothing()
			.run();
		db.insert(account)
			.values({
				id: `acc-${person.id}`,
				accountId: person.id,
				providerId: 'credential',
				userId: person.id,
				password,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoNothing()
			.run();
		db.insert(familyMember)
			.values({
				familyId: IDS.familia,
				userId: person.id,
				role: person.id === IDS.enrico ? 'owner' : 'member',
				joinedAt: now
			})
			.onConflictDoNothing()
			.run();
		db.insert(giftList)
			.values({
				id: person.listId,
				familyId: IDS.familia,
				ownerId: person.id,
				name: person.firstName,
				isPersonal: true,
				createdAt: now,
				updatedAt: now
			})
			.onConflictDoNothing()
			.run();
	}

	db.insert(giftList)
		.values({
			id: IDS.listAlba,
			familyId: IDS.familia,
			ownerId: IDS.enrico,
			name: 'Alba',
			isPersonal: false,
			createdAt: now,
			updatedAt: now
		})
		.onConflictDoNothing()
		.run();
	for (const adminId of [IDS.enrico, IDS.lucile]) {
		db.insert(listAdmin)
			.values({ listId: IDS.listAlba, userId: adminId, createdAt: now })
			.onConflictDoNothing()
			.run();
	}
	db.insert(listFamily)
		.values({ listId: IDS.listAlba, familyId: IDS.familia })
		.onConflictDoNothing()
		.run();

	const gifts = [
		{
			id: 'gift-free',
			listId: IDS.listLucile,
			createdBy: IDS.lucile,
			title: 'Taccuino in lino',
			description: 'Uno spesso, con carta avorio.',
			url: 'https://example.com/taccuino',
			reservedBy: null,
			receivedAt: null,
			hidden: false
		},
		{
			id: 'gift-reserved',
			listId: IDS.listLucile,
			createdBy: IDS.lucile,
			title: 'Cuffie quiete',
			description: 'Per i treni lunghi.',
			url: null,
			reservedBy: IDS.enrico,
			receivedAt: null,
			hidden: false
		},
		{
			id: 'gift-received',
			listId: IDS.listLucile,
			createdBy: IDS.lucile,
			title: 'Sciarpa di merino',
			description: null,
			url: null,
			reservedBy: IDS.caroline,
			receivedAt: now,
			hidden: false
		},
		{
			id: 'gift-long',
			listId: IDS.listLucile,
			createdBy: IDS.lucile,
			title:
				'Una lampada da tavolo bassissima, calda, che non ruba la scrivania e che si possa spegnere con un tocco senza svegliare la casa',
			description: 'Con dimmer lento.',
			url: 'https://example.com/lampada',
			reservedBy: null,
			receivedAt: null,
			hidden: false
		},
		{
			id: 'gift-secret',
			listId: IDS.listLucile,
			createdBy: IDS.enrico,
			title: 'Weekend al mare',
			description: 'Non dirglielo.',
			url: null,
			reservedBy: null,
			receivedAt: null,
			hidden: true
		},
		{
			id: 'gift-enrico',
			listId: IDS.listEnrico,
			createdBy: IDS.enrico,
			title: 'Pantofole di feltro',
			description: 'Numero 43.',
			url: null,
			reservedBy: null,
			receivedAt: null,
			hidden: false
		}
	];

	for (const item of gifts) {
		const exists = db.select().from(gift).where(eq(gift.id, item.id)).get();
		if (exists) continue;
		db.insert(gift)
			.values({
				id: item.id,
				listId: item.listId,
				createdBy: item.createdBy,
				title: item.title,
				description: item.description,
				url: item.url,
				reservedBy: item.reservedBy,
				reservedAt: item.reservedBy ? now : null,
				receivedAt: item.receivedAt,
				hiddenFromRecipient: item.hidden,
				createdAt: now,
				updatedAt: now
			})
			.run();
	}

	const commentExists = db.select().from(giftComment).where(eq(giftComment.id, 'comment-1')).get();
	if (!commentExists) {
		db.insert(giftComment)
			.values({
				id: 'comment-1',
				giftId: 'gift-reserved',
				authorId: IDS.enrico,
				body: 'Le prendo io, taglia unica.',
				createdAt: now,
				updatedAt: now
			})
			.run();
	}

	return db;
}

if (import.meta.url === `file://${process.argv[1]}`) {
	if (!process.env.DATABASE_URL) process.env.DATABASE_URL = 'data/geeft.sqlite';
	await seedDatabase();
	console.log('Seeded Pétisné (8 adults + lista gestita Alba)');
}
