import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { coerceLocale, type Locale } from '$lib/i18n/catalog';

export function storedLocaleForEmail(email: string): Locale {
	const row = db.select({ locale: user.locale }).from(user).where(eq(user.email, email)).get();
	return coerceLocale(row?.locale);
}

export function storedLocaleForId(id: string): Locale {
	const row = db.select({ locale: user.locale }).from(user).where(eq(user.id, id)).get();
	return coerceLocale(row?.locale);
}
