import { env } from '$env/dynamic/private';
import { createSqlite, type Db } from './sqlite';

export type { Db };
export { createSqlite };

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

const sqlite = createSqlite(env.DATABASE_URL);
export const client = sqlite.client;
export const db = sqlite.db;
