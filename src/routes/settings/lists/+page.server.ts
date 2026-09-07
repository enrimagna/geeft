import { db } from '$lib/server/db';
import { actionFail } from '$lib/server/errors';
import {
	addListAdmin,
	adminsOf,
	allManagedListsFor,
	createManagedList,
	deleteManagedList,
	familiesOfUser,
	membersForListInvite,
	removeListAdmin,
	setListShares,
	sharesOf
} from '$lib/server/lists';
import { requireCurrentFamily, requirePageUser } from '$lib/server/session';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const user = requirePageUser(event);
	const fam = requireCurrentFamily(db, user);
	const families = familiesOfUser(db, user.id);
	const lists = allManagedListsFor(db, user.id).map((list) => ({
		...list,
		admins: adminsOf(db, list.id),
		shares: sharesOf(db, list.id),
		members: membersForListInvite(db, list.id, user.id)
	}));
	return { lists, families, currentFamilyId: fam.id };
};

export const actions: Actions = {
	create: async (event) => {
		const user = requirePageUser(event);
		try {
			const fam = requireCurrentFamily(db, user);
			const form = await event.request.formData();
			createManagedList(db, fam.id, user.id, form.get('name')?.toString() ?? '', user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	addAdmin: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			addListAdmin(
				db,
				form.get('listId')?.toString() ?? '',
				user.id,
				form.get('userId')?.toString() ?? '',
				user.locale
			);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	removeAdmin: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			removeListAdmin(
				db,
				form.get('listId')?.toString() ?? '',
				user.id,
				form.get('userId')?.toString() ?? '',
				user.locale
			);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	delete: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			deleteManagedList(db, form.get('listId')?.toString() ?? '', user.id, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	},
	shares: async (event) => {
		const user = requirePageUser(event);
		try {
			const form = await event.request.formData();
			const familyIds = form.getAll('familyId').map((value) => value.toString());
			setListShares(db, form.get('listId')?.toString() ?? '', user.id, familyIds, user.locale);
			return { ok: true };
		} catch (error) {
			return actionFail(error);
		}
	}
};
