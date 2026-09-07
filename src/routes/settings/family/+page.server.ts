import { db } from '$lib/server/db';
import { actionFail } from '$lib/server/errors';
import {
	createFamily,
	joinFamily,
	listFamilies,
	regenerateInvite,
	switchFamily
} from '$lib/server/families';
import { requirePageUser } from '$lib/server/session';
import { isRedirect, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requirePageUser(event);
	const families = listFamilies(db, user.id);
	return {
		families,
		currentFamilyId: user.currentFamilyId,
		invite: event.url.searchParams.get('invite')
	};
};

export const actions: Actions = {
	switch: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			switchFamily(db, user, form.get('familyId')?.toString() ?? '');
			throw redirect(302, '/settings/family');
		} catch (error) {
			if (isRedirect(error)) throw error;
			return actionFail(error);
		}
	},
	create: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			const created = createFamily(db, user, form.get('name')?.toString() ?? '', user.locale);
			throw redirect(302, `/settings/family?invite=${encodeURIComponent(created.inviteCode)}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return actionFail(error);
		}
	},
	join: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			joinFamily(db, user, form.get('invite')?.toString() ?? '', user.locale);
			throw redirect(302, '/settings/family');
		} catch (error) {
			if (isRedirect(error)) throw error;
			return actionFail(error);
		}
	},
	regenerate: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			const invite = regenerateInvite(
				db,
				user,
				form.get('familyId')?.toString() ?? '',
				user.locale
			);
			throw redirect(302, `/settings/family?invite=${encodeURIComponent(invite)}`);
		} catch (error) {
			if (isRedirect(error)) throw error;
			return actionFail(error);
		}
	}
};
