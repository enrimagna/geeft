import type { User, Session } from 'better-auth';

declare global {
	namespace App {
		interface Locals {
			user?: User & {
				firstName?: string;
				lastName?: string | null;
				locale?: string;
				currentFamilyId?: string | null;
			};
			session?: Session;
		}
	}
}

export {};
