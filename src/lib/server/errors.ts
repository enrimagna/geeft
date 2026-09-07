import { fail, json } from '@sveltejs/kit';
import { t, type Locale, type MessageKey } from '$lib/i18n/catalog';

export class AppError extends Error {
	constructor(
		public status: 401 | 403 | 404 | 409 | 422,
		public key: MessageKey,
		public locale: Locale = 'it'
	) {
		super(t(locale, key));
		this.name = 'AppError';
	}
}

export function actionFail(error: unknown) {
	if (error instanceof AppError) {
		return fail(error.status, { message: error.message, status: error.status, key: error.key });
	}
	throw error;
}

export function jsonError(error: unknown) {
	if (error instanceof AppError) {
		return json(
			{ message: error.message, status: error.status, key: error.key },
			{ status: error.status }
		);
	}
	throw error;
}
