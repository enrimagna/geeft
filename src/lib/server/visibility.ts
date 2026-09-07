import type { gift } from '$lib/server/db/schema';

type GiftRow = typeof gift.$inferSelect;

export type ReceiveGift = {
	id: string;
	title: string;
	description: string | null;
	url: string | null;
	receivedAt: Date | null;
	createdAt: Date;
};

export type GiveGift = {
	id: string;
	title: string;
	description: string | null;
	url: string | null;
	receivedAt: Date | null;
	createdAt: Date;
	reservation: 'none' | 'mine' | 'other';
	hiddenFromRecipient: boolean;
	createdByMe: boolean;
};

export function toReceiveGift(row: GiftRow): ReceiveGift {
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		url: row.url,
		receivedAt: row.receivedAt,
		createdAt: row.createdAt
	};
}

export function toGiveGift(row: GiftRow, viewerId: string): GiveGift {
	const reservation: GiveGift['reservation'] = row.reservedBy
		? row.reservedBy === viewerId
			? 'mine'
			: 'other'
		: 'none';
	return {
		id: row.id,
		title: row.title,
		description: row.description,
		url: row.url,
		receivedAt: row.receivedAt,
		createdAt: row.createdAt,
		reservation,
		hiddenFromRecipient: row.hiddenFromRecipient,
		createdByMe: row.createdBy === viewerId
	};
}

export function assertNoLeak(payload: unknown) {
	const text = JSON.stringify(payload);
	if (
		text.includes('reservedBy') ||
		text.includes('reserved_by') ||
		text.includes('authorId') ||
		text.includes('createdBy')
	) {
		throw new Error('visibility leak');
	}
}
