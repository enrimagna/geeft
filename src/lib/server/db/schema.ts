import { sql } from 'drizzle-orm';
import {
	index,
	integer,
	primaryKey,
	sqliteTable,
	text,
	uniqueIndex
} from 'drizzle-orm/sqlite-core';
import { user } from './auth.schema';

export * from './auth.schema';

const ts = () =>
	integer('created_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.notNull();

const updated = () =>
	integer('updated_at', { mode: 'timestamp_ms' })
		.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
		.$onUpdate(() => new Date())
		.notNull();

export const family = sqliteTable('family', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	inviteCodeHash: text('invite_code_hash').notNull().unique(),
	createdAt: ts()
});

export const familyMember = sqliteTable(
	'family_member',
	{
		familyId: text('family_id')
			.notNull()
			.references(() => family.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		role: text('role', { enum: ['owner', 'member'] })
			.notNull()
			.default('member'),
		joinedAt: integer('joined_at', { mode: 'timestamp_ms' })
			.default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
			.notNull()
	},
	(table) => [
		primaryKey({ columns: [table.familyId, table.userId] }),
		index('family_member_user_idx').on(table.userId),
		index('family_member_family_idx').on(table.familyId)
	]
);

export const giftList = sqliteTable(
	'gift_list',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		familyId: text('family_id')
			.notNull()
			.references(() => family.id, { onDelete: 'cascade' }),
		ownerId: text('owner_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		name: text('name').notNull(),
		isPersonal: integer('is_personal', { mode: 'boolean' }).notNull().default(true),
		createdAt: ts(),
		updatedAt: updated()
	},
	(table) => [
		uniqueIndex('gift_list_personal_owner_uidx')
			.on(table.ownerId)
			.where(sql`${table.isPersonal} = 1`),
		uniqueIndex('gift_list_managed_name_uidx')
			.on(table.familyId, table.name)
			.where(sql`${table.isPersonal} = 0`),
		index('gift_list_family_owner_idx').on(table.familyId, table.ownerId)
	]
);

export const listFamily = sqliteTable(
	'list_family',
	{
		listId: text('list_id')
			.notNull()
			.references(() => giftList.id, { onDelete: 'cascade' }),
		familyId: text('family_id')
			.notNull()
			.references(() => family.id, { onDelete: 'cascade' })
	},
	(table) => [
		primaryKey({ columns: [table.listId, table.familyId] }),
		index('list_family_family_idx').on(table.familyId)
	]
);

export const listAdmin = sqliteTable(
	'list_admin',
	{
		listId: text('list_id')
			.notNull()
			.references(() => giftList.id, { onDelete: 'cascade' }),
		userId: text('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		createdAt: ts()
	},
	(table) => [
		primaryKey({ columns: [table.listId, table.userId] }),
		index('list_admin_user_idx').on(table.userId),
		index('list_admin_list_idx').on(table.listId)
	]
);

export const gift = sqliteTable(
	'gift',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		listId: text('list_id')
			.notNull()
			.references(() => giftList.id, { onDelete: 'cascade' }),
		createdBy: text('created_by')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		title: text('title').notNull(),
		description: text('description'),
		url: text('url'),
		reservedBy: text('reserved_by').references(() => user.id, { onDelete: 'set null' }),
		reservedAt: integer('reserved_at', { mode: 'timestamp_ms' }),
		receivedAt: integer('received_at', { mode: 'timestamp_ms' }),
		hiddenFromRecipient: integer('hidden_from_recipient', { mode: 'boolean' })
			.notNull()
			.default(false),
		createdAt: ts(),
		updatedAt: updated()
	},
	(table) => [
		index('gift_list_idx').on(table.listId),
		index('gift_created_by_idx').on(table.createdBy),
		index('gift_reserved_by_idx').on(table.reservedBy),
		index('gift_hidden_idx').on(table.hiddenFromRecipient),
		index('gift_list_created_id_idx').on(table.listId, table.createdAt, table.id)
	]
);

export const giftComment = sqliteTable(
	'gift_comment',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		giftId: text('gift_id')
			.notNull()
			.references(() => gift.id, { onDelete: 'cascade' }),
		authorId: text('author_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		body: text('body').notNull(),
		createdAt: ts(),
		updatedAt: updated()
	},
	(table) => [
		index('gift_comment_gift_created_idx').on(table.giftId, table.createdAt),
		index('gift_comment_author_idx').on(table.authorId)
	]
);
