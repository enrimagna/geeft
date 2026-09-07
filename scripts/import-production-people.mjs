/**
 * One-shot production import. Maps the existing Pétisné seed users to real
 * emails/display names and creates the shared lists from the old Geeft export.
 * Safe to re-run (insert or ignore / update by id).
 */
import { createHash, randomBytes } from 'node:crypto';
import Database from 'better-sqlite3';

const dbPath = process.env.DATABASE_URL || '/data/geeft.sqlite';
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const now = Date.now();
const PET = '11111111-1111-4111-8111-111111111111';
const FOLLE = '10000000-0000-4000-8000-000000000010';

const U = {
	lucile: '22222222-2222-4222-8222-222222222222',
	enrico: '33333333-3333-4333-8333-333333333333',
	caroline: '44444444-4444-4444-8444-444444444444',
	helene: 'aaaa1111-1111-4111-8111-111111111111',
	thomas: 'bbbb1111-1111-4111-8111-111111111111',
	isabelle: 'cccc1111-1111-4111-8111-111111111111',
	christian: 'dddd1111-1111-4111-8111-111111111111',
	jeremy: 'eeee1111-1111-4111-8111-111111111111'
};

const people = [
	{ id: U.enrico, firstName: 'Enrico', email: 'enrico@magnarello.eu', locale: 'it' },
	{ id: U.lucile, firstName: 'Lulu', email: 'lucile.petisne@gmail.com', locale: 'it' },
	{ id: U.caroline, firstName: 'Caro', email: 'carolinepetisne@hotmail.fr', locale: 'fr' },
	{ id: U.helene, firstName: 'Hélène', email: 'helenepetisne@hotmail.com', locale: 'fr' },
	{ id: U.thomas, firstName: 'Toto', email: 'thompetisnebeau13@gmail.com', locale: 'fr' },
	{ id: U.isabelle, firstName: 'Isabelle', email: 'isabelle@davoine.com', locale: 'fr' },
	{ id: U.christian, firstName: 'Christian', email: 'christian.petisne@gmail.com', locale: 'fr' },
	{ id: U.jeremy, firstName: 'Jérémy', email: 'brasseurjeremy@orange.fr', locale: 'fr' }
];

const lists = [
	{
		id: '10000000-0000-4000-8000-000000000001',
		name: 'Couple Magnarello',
		ownerId: U.enrico,
		admins: [U.enrico, U.lucile],
		families: [PET, FOLLE]
	},
	{
		id: '10000000-0000-4000-8000-000000000002',
		name: 'Couple Brasseur',
		ownerId: U.jeremy,
		admins: [U.jeremy, U.caroline],
		families: [PET]
	},
	{
		id: '10000000-0000-4000-8000-000000000003',
		name: 'Marius',
		ownerId: U.jeremy,
		admins: [U.jeremy, U.caroline],
		families: [PET]
	},
	{
		id: '10000000-0000-4000-8000-000000000004',
		name: 'Agathe',
		ownerId: U.jeremy,
		admins: [U.jeremy, U.caroline],
		families: [PET]
	},
	{
		id: '10000000-0000-4000-8000-000000000005',
		name: 'Eloïse',
		ownerId: U.jeremy,
		admins: [U.jeremy, U.caroline],
		families: [PET]
	},
	{
		id: '10000000-0000-4000-8000-000000000006',
		name: 'Marya',
		ownerId: U.thomas,
		admins: [U.thomas],
		families: [PET]
	}
];

function hashInvite(code) {
	return createHash('sha256').update(code.trim()).digest('hex');
}

const tx = db.transaction(() => {
	const updateUser = db.prepare(
		`update user set name = ?, email = ?, first_name = ?, locale = ?, email_verified = 1, updated_at = ? where id = ?`
	);
	const updatePersonal = db.prepare(
		`update gift_list set name = ?, updated_at = ? where owner_id = ? and is_personal = 1`
	);
	for (const person of people) {
		const row = db.prepare('select id from user where id = ?').get(person.id);
		if (!row) throw new Error(`missing seed user ${person.email}`);
		updateUser.run(person.firstName, person.email, person.firstName, person.locale, now, person.id);
		updatePersonal.run(person.firstName, now, person.id);
	}

	let folleInvite = null;
	if (!db.prepare('select id from family where id = ?').get(FOLLE)) {
		folleInvite = randomBytes(9).toString('base64url');
		db.prepare(
			`insert into family (id, name, invite_code_hash, created_at) values (?, ?, ?, ?)`
		).run(FOLLE, 'Famille Folle', hashInvite(folleInvite), now);
	}
	db.prepare(
		`insert or ignore into family_member (family_id, user_id, role, joined_at) values (?, ?, 'owner', ?)`
	).run(FOLLE, U.enrico, now);
	db.prepare(
		`insert or ignore into family_member (family_id, user_id, role, joined_at) values (?, ?, 'member', ?)`
	).run(FOLLE, U.lucile, now);

	const insertList = db.prepare(
		`insert or ignore into gift_list (id, family_id, owner_id, name, is_personal, created_at, updated_at)
		 values (?, ?, ?, ?, 0, ?, ?)`
	);
	const insertAdmin = db.prepare(
		`insert or ignore into list_admin (list_id, user_id, created_at) values (?, ?, ?)`
	);
	const insertShare = db.prepare(
		`insert or ignore into list_family (list_id, family_id) values (?, ?)`
	);

	for (const list of lists) {
		const byName = db
			.prepare('select id from gift_list where is_personal = 0 and name = ?')
			.get(list.name);
		const listId = byName?.id ?? list.id;
		insertList.run(listId, PET, list.ownerId, list.name, now, now);
		for (const adminId of list.admins) insertAdmin.run(listId, adminId, now);
		for (const familyId of list.families) insertShare.run(listId, familyId);
	}

	return folleInvite;
});

const folleInvite = tx();

console.log('users:');
for (const row of db.prepare('select first_name, email, locale from user order by first_name').all()) {
	console.log(`  ${row.first_name} <${row.email}> ${row.locale}`);
}
console.log('families:');
for (const row of db.prepare('select name from family order by name').all()) {
	console.log(`  ${row.name}`);
}
console.log('managed lists:');
for (const row of db
	.prepare(
		`select g.name, group_concat(u.first_name) as admins
		 from gift_list g
		 join list_admin a on a.list_id = g.id
		 join user u on u.id = a.user_id
		 where g.is_personal = 0
		 group by g.id
		 order by g.name`
	)
	.all()) {
	console.log(`  ${row.name} — ${row.admins}`);
}
if (folleInvite) console.log(`Famille Folle invite: ${folleInvite}`);
db.close();
