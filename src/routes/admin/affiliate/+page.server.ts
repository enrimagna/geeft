import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import {
	clickCountsForNetworks,
	createNetwork,
	disableNetwork,
	isAffiliateEnabled,
	isGeeftAdmin,
	loadAllNetworks,
	maskTag,
	parseHostsText,
	recentClicks,
	requireGeeftAdmin,
	setAffiliateEnabled,
	totalClicksSince,
	updateNetwork,
	validateExtraParamsJson
} from '$lib/server/affiliate';
import { actionFail } from '$lib/server/errors';
import { requirePageUser } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requirePageUser(event);
	if (!isGeeftAdmin(user.id)) throw error(404, 'Not found');

	const networks = loadAllNetworks(db);
	const clicks7 = clickCountsForNetworks(db, 7);
	const clicks30 = clickCountsForNetworks(db, 30);

	return {
		affiliateEnabled: isAffiliateEnabled(db),
		totals: {
			clicks7: totalClicksSince(db, 7),
			clicks30: totalClicksSince(db, 30)
		},
		networks: networks.map((network) => ({
			id: network.id,
			key: network.key,
			name: network.name,
			enabled: network.enabled,
			priority: network.priority,
			hostPatterns: network.hostPatterns,
			tagParam: network.tagParam,
			tagMasked: maskTag(network.tagValue),
			tagValue: network.tagValue,
			extraParams: network.extraParams ? JSON.stringify(network.extraParams) : '',
			notes: '',
			clicks7: clicks7.get(network.id) ?? 0,
			clicks30: clicks30.get(network.id) ?? 0
		})),
		recent: recentClicks(db, 50).map((click) => ({
			id: click.id,
			createdAt: click.createdAt?.toISOString?.() ?? String(click.createdAt),
			giftIdShort: click.giftId.slice(0, 8),
			host: click.originalHost,
			rewritten: click.rewritten,
			network: click.networkKey ?? click.networkName ?? '—',
			userIdShort: click.userId ? click.userId.slice(0, 8) : null
		}))
	};
};

export const actions: Actions = {
	toggle: async (event) => {
		const user = requirePageUser(event);
		try {
			requireGeeftAdmin(user.id, user.locale);
			const form = await event.request.formData();
			setAffiliateEnabled(db, form.get('affiliate_enabled') === '1');
			return { ok: true };
		} catch (err) {
			return actionFail(err);
		}
	},
	create: async (event) => {
		const user = requirePageUser(event);
		try {
			requireGeeftAdmin(user.id, user.locale);
			const form = await event.request.formData();
			createNetwork(db, {
				key: form.get('key')?.toString() ?? '',
				name: form.get('name')?.toString() ?? '',
				hostPatterns: parseHostsText(form.get('hostPatterns')?.toString() ?? ''),
				tagParam: form.get('tagParam')?.toString() ?? 'tag',
				tagValue: form.get('tagValue')?.toString() ?? '',
				extraParams: validateExtraParamsJson(form.get('extraParams')?.toString(), user.locale),
				priority: Number(form.get('priority')?.toString() ?? '100') || 100,
				enabled: form.get('enabled') === '1',
				notes: form.get('notes')?.toString() ?? null,
				locale: user.locale
			});
			return { ok: true };
		} catch (err) {
			return actionFail(err);
		}
	},
	update: async (event) => {
		const user = requirePageUser(event);
		try {
			requireGeeftAdmin(user.id, user.locale);
			const form = await event.request.formData();
			updateNetwork(db, {
				id: form.get('id')?.toString() ?? '',
				name: form.get('name')?.toString() ?? '',
				hostPatterns: parseHostsText(form.get('hostPatterns')?.toString() ?? ''),
				tagParam: form.get('tagParam')?.toString() ?? 'tag',
				tagValue: form.get('tagValue')?.toString() ?? '',
				extraParams: validateExtraParamsJson(form.get('extraParams')?.toString(), user.locale),
				priority: Number(form.get('priority')?.toString() ?? '100') || 100,
				enabled: form.get('enabled') === '1',
				notes: form.get('notes')?.toString() ?? null,
				locale: user.locale
			});
			return { ok: true };
		} catch (err) {
			return actionFail(err);
		}
	},
	disable: async (event) => {
		const user = requirePageUser(event);
		try {
			requireGeeftAdmin(user.id, user.locale);
			const form = await event.request.formData();
			disableNetwork(db, form.get('id')?.toString() ?? '', user.locale);
			return { ok: true };
		} catch (err) {
			return actionFail(err);
		}
	}
};
