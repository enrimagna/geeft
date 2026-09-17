import { createHash } from 'node:crypto';
import { and, asc, count, desc, eq, gte, sql } from 'drizzle-orm';
import type { Db } from '$lib/server/db/sqlite';
import {
	affiliateClick,
	affiliateNetwork,
	appSettings,
	familyMember,
	gift,
	giftList,
	listAdmin,
	listFamily
} from '$lib/server/db/schema';
import { env } from '$env/dynamic/private';
import { AppError } from '$lib/server/errors';
import type { Locale } from '$lib/i18n/catalog';

export const AFFILIATE_ENABLED_KEY = 'affiliate_enabled';

export type AffiliateNetworkRule = {
	id: string;
	key: string;
	name: string;
	enabled: boolean;
	priority: number;
	hostPatterns: string[];
	tagParam: string;
	tagValue: string;
	extraParams: Record<string, string> | null;
};

export type RewriteResult = {
	url: string;
	networkId: string | null;
	rewritten: boolean;
	host: string;
};

function parseHostPatterns(raw: string): string[] {
	try {
		const parsed = JSON.parse(raw);
		if (!Array.isArray(parsed)) return [];
		return parsed.map((item) => String(item).trim().toLowerCase()).filter(Boolean);
	} catch {
		return [];
	}
}

function parseExtraParams(raw: string | null): Record<string, string> | null {
	if (!raw?.trim()) return null;
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
		const out: Record<string, string> = {};
		for (const [key, value] of Object.entries(parsed)) {
			if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
				out[key] = String(value);
			}
		}
		return out;
	} catch {
		return null;
	}
}

export function hostMatches(host: string, pattern: string): boolean {
	const h = host.toLowerCase();
	const p = pattern.toLowerCase().replace(/^\./, '');
	return h === p || h.endsWith(`.${p}`);
}

export function rewriteAffiliateUrl(
	url: string,
	networks: AffiliateNetworkRule[],
	options?: { enabled?: boolean; locale?: Locale }
): RewriteResult {
	void options?.locale;
	const original = url?.trim() ?? '';
	if (!original) {
		return { url: original, networkId: null, rewritten: false, host: '' };
	}

	let parsed: URL;
	try {
		parsed = new URL(original);
	} catch {
		return { url: original, networkId: null, rewritten: false, host: '' };
	}

	if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
		return {
			url: original,
			networkId: null,
			rewritten: false,
			host: parsed.hostname.toLowerCase()
		};
	}

	const host = parsed.hostname.toLowerCase();

	if (options?.enabled === false) {
		return { url: original, networkId: null, rewritten: false, host };
	}

	const enabledNetworks = networks
		.filter((network) => network.enabled)
		.slice()
		.sort((a, b) => a.priority - b.priority);

	const match = enabledNetworks.find((network) =>
		network.hostPatterns.some((pattern) => hostMatches(host, pattern))
	);

	if (!match || !match.tagValue.trim()) {
		return { url: original, networkId: null, rewritten: false, host };
	}

	const rewritten = new URL(parsed.toString());
	rewritten.searchParams.set(match.tagParam || 'tag', match.tagValue);
	if (match.extraParams) {
		for (const [key, value] of Object.entries(match.extraParams)) {
			rewritten.searchParams.set(key, value);
		}
	}

	return {
		url: rewritten.toString(),
		networkId: match.id,
		rewritten: true,
		host
	};
}

export function isAffiliateEnabled(db: Db): boolean {
	const row = db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, AFFILIATE_ENABLED_KEY))
		.get();
	return row?.value === '1';
}

export function setAffiliateEnabled(db: Db, enabled: boolean) {
	const now = new Date();
	const existing = db
		.select()
		.from(appSettings)
		.where(eq(appSettings.key, AFFILIATE_ENABLED_KEY))
		.get();
	if (existing) {
		db.update(appSettings)
			.set({ value: enabled ? '1' : '0', updatedAt: now })
			.where(eq(appSettings.key, AFFILIATE_ENABLED_KEY))
			.run();
	} else {
		db.insert(appSettings)
			.values({ key: AFFILIATE_ENABLED_KEY, value: enabled ? '1' : '0', updatedAt: now })
			.run();
	}
}

export function loadEnabledNetworks(db: Db): AffiliateNetworkRule[] {
	return db
		.select()
		.from(affiliateNetwork)
		.where(eq(affiliateNetwork.enabled, true))
		.orderBy(asc(affiliateNetwork.priority), asc(affiliateNetwork.key))
		.all()
		.map(rowToRule);
}

export function loadAllNetworks(db: Db): AffiliateNetworkRule[] {
	return db
		.select()
		.from(affiliateNetwork)
		.orderBy(asc(affiliateNetwork.priority), asc(affiliateNetwork.key))
		.all()
		.map(rowToRule);
}

function rowToRule(row: typeof affiliateNetwork.$inferSelect): AffiliateNetworkRule {
	return {
		id: row.id,
		key: row.key,
		name: row.name,
		enabled: row.enabled,
		priority: row.priority,
		hostPatterns: parseHostPatterns(row.hostPatterns),
		tagParam: row.tagParam,
		tagValue: row.tagValue,
		extraParams: parseExtraParams(row.extraParams)
	};
}

export function maskTag(value: string): string {
	const trimmed = value.trim();
	if (!trimmed) return '—';
	if (trimmed.length <= 3) return `${trimmed[0] ?? ''}***`;
	return `${trimmed.slice(0, 3)}***`;
}

/** Family member of a family where the gift list is visible (personal owner family or shared managed). */
export function canAccessGiftRedirect(db: Db, giftId: string, userId: string): boolean {
	const row = db
		.select({
			giftId: gift.id,
			listId: gift.listId,
			isPersonal: giftList.isPersonal,
			ownerId: giftList.ownerId
		})
		.from(gift)
		.innerJoin(giftList, eq(giftList.id, gift.listId))
		.where(eq(gift.id, giftId))
		.get();
	if (!row) return false;

	if (row.isPersonal) {
		if (row.ownerId === userId) return true;
		const shared = db
			.select({ familyId: familyMember.familyId })
			.from(familyMember)
			.where(eq(familyMember.userId, row.ownerId))
			.all();
		for (const { familyId } of shared) {
			const member = db
				.select()
				.from(familyMember)
				.where(and(eq(familyMember.familyId, familyId), eq(familyMember.userId, userId)))
				.get();
			if (member) return true;
		}
		return false;
	}

	if (
		db
			.select()
			.from(listAdmin)
			.where(and(eq(listAdmin.listId, row.listId), eq(listAdmin.userId, userId)))
			.get()
	) {
		return true;
	}

	const shares = db.select().from(listFamily).where(eq(listFamily.listId, row.listId)).all();
	for (const share of shares) {
		const member = db
			.select()
			.from(familyMember)
			.where(and(eq(familyMember.familyId, share.familyId), eq(familyMember.userId, userId)))
			.get();
		if (member) return true;
	}
	return false;
}

export function hashUserAgent(ua: string | null): string | null {
	if (!ua) return null;
	return createHash('sha256').update(ua).digest('hex').slice(0, 32);
}

export function logAffiliateClick(
	db: Db,
	input: {
		giftId: string;
		userId: string | null;
		networkId: string | null;
		originalHost: string;
		rewritten: boolean;
		uaHash: string | null;
	}
) {
	db.insert(affiliateClick)
		.values({
			id: crypto.randomUUID(),
			giftId: input.giftId,
			userId: input.userId,
			networkId: input.networkId,
			originalHost: input.originalHost,
			rewritten: input.rewritten,
			uaHash: input.uaHash
		})
		.run();
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function checkRedirectRateLimit(userId: string, limit = 60, windowMs = 60_000): boolean {
	const now = Date.now();
	const bucket = rateBuckets.get(userId);
	if (!bucket || bucket.resetAt <= now) {
		rateBuckets.set(userId, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (bucket.count >= limit) return false;
	bucket.count += 1;
	return true;
}

export function isGeeftAdmin(userId: string): boolean {
	const raw = env.GEEFT_ADMIN_IDS?.trim() || process.env.GEEFT_ADMIN_IDS?.trim() || '';
	const ids = raw
		.split(',')
		.map((part) => part.trim())
		.filter(Boolean);
	return ids.includes(userId);
}

export function requireGeeftAdmin(userId: string, locale: Locale = 'it'): void {
	if (!isGeeftAdmin(userId)) throw new AppError(404, 'error.notFound', locale);
}

export function parseHostsText(text: string): string[] {
	return text
		.split(/[\n,]+/)
		.map((line) => line.trim().toLowerCase())
		.filter(Boolean);
}

export function hostsToJson(hosts: string[]): string {
	return JSON.stringify(hosts);
}

export function validateExtraParamsJson(raw: string | null | undefined, locale: Locale): string | null {
	const value = raw?.trim() || '';
	if (!value) return null;
	try {
		const parsed = JSON.parse(value);
		if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
			throw new AppError(422, 'error.validation', locale);
		}
		return JSON.stringify(parsed);
	} catch (error) {
		if (error instanceof AppError) throw error;
		throw new AppError(422, 'error.validation', locale);
	}
}

export function createNetwork(
	db: Db,
	input: {
		key: string;
		name: string;
		hostPatterns: string[];
		tagParam: string;
		tagValue: string;
		extraParams: string | null;
		priority: number;
		enabled: boolean;
		notes?: string | null;
		locale: Locale;
	}
) {
	const key = input.key.trim().toLowerCase();
	const name = input.name.trim();
	if (!key || !name || input.hostPatterns.length === 0) {
		throw new AppError(422, 'error.validation', input.locale);
	}
	if (input.enabled && !input.tagValue.trim()) {
		throw new AppError(422, 'error.validation', input.locale);
	}
	const existing = db.select().from(affiliateNetwork).where(eq(affiliateNetwork.key, key)).get();
	if (existing) throw new AppError(409, 'error.validation', input.locale);
	const id = crypto.randomUUID();
	db.insert(affiliateNetwork)
		.values({
			id,
			key,
			name,
			enabled: input.enabled,
			priority: input.priority,
			hostPatterns: hostsToJson(input.hostPatterns),
			tagParam: input.tagParam.trim() || 'tag',
			tagValue: input.tagValue,
			extraParams: input.extraParams,
			notes: input.notes?.trim() || null
		})
		.run();
	return id;
}

export function updateNetwork(
	db: Db,
	input: {
		id: string;
		name: string;
		hostPatterns: string[];
		tagParam: string;
		tagValue: string;
		extraParams: string | null;
		priority: number;
		enabled: boolean;
		notes?: string | null;
		locale: Locale;
	}
) {
	const row = db.select().from(affiliateNetwork).where(eq(affiliateNetwork.id, input.id)).get();
	if (!row) throw new AppError(404, 'error.notFound', input.locale);
	const name = input.name.trim();
	if (!name || input.hostPatterns.length === 0) {
		throw new AppError(422, 'error.validation', input.locale);
	}
	if (input.enabled && !input.tagValue.trim()) {
		throw new AppError(422, 'error.validation', input.locale);
	}
	db.update(affiliateNetwork)
		.set({
			name,
			enabled: input.enabled,
			priority: input.priority,
			hostPatterns: hostsToJson(input.hostPatterns),
			tagParam: input.tagParam.trim() || 'tag',
			tagValue: input.tagValue,
			extraParams: input.extraParams,
			notes: input.notes?.trim() || null,
			updatedAt: new Date()
		})
		.where(eq(affiliateNetwork.id, input.id))
		.run();
}

export function disableNetwork(db: Db, id: string, locale: Locale) {
	const row = db.select().from(affiliateNetwork).where(eq(affiliateNetwork.id, id)).get();
	if (!row) throw new AppError(404, 'error.notFound', locale);
	db.update(affiliateNetwork)
		.set({ enabled: false, updatedAt: new Date() })
		.where(eq(affiliateNetwork.id, id))
		.run();
}

export function clickCountsForNetworks(db: Db, days: number) {
	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	const rows = db
		.select({
			networkId: affiliateClick.networkId,
			total: count()
		})
		.from(affiliateClick)
		.where(and(gte(affiliateClick.createdAt, since), sql`${affiliateClick.networkId} is not null`))
		.groupBy(affiliateClick.networkId)
		.all();
	const map = new Map<string, number>();
	for (const row of rows) {
		if (row.networkId) map.set(row.networkId, Number(row.total));
	}
	return map;
}

export function totalClicksSince(db: Db, days: number): number {
	const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
	const row = db
		.select({ total: count() })
		.from(affiliateClick)
		.where(gte(affiliateClick.createdAt, since))
		.get();
	return Number(row?.total ?? 0);
}

export function recentClicks(db: Db, limit = 50) {
	return db
		.select({
			id: affiliateClick.id,
			giftId: affiliateClick.giftId,
			userId: affiliateClick.userId,
			networkId: affiliateClick.networkId,
			originalHost: affiliateClick.originalHost,
			rewritten: affiliateClick.rewritten,
			createdAt: affiliateClick.createdAt,
			networkKey: affiliateNetwork.key,
			networkName: affiliateNetwork.name
		})
		.from(affiliateClick)
		.leftJoin(affiliateNetwork, eq(affiliateNetwork.id, affiliateClick.networkId))
		.orderBy(desc(affiliateClick.createdAt))
		.limit(limit)
		.all();
}
