import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

export type Db = BetterSQLite3Database<typeof schema>;

export function createSqlite(url: string): { client: Database.Database; db: Db } {
	if (url !== ':memory:') {
		const dir = dirname(url);
		if (dir && dir !== '.') mkdirSync(dir, { recursive: true });
	}
	const client = new Database(url);
	client.pragma('journal_mode = WAL');
	client.pragma('foreign_keys = ON');
	return { client, db: drizzle(client, { schema }) };
}
