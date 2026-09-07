import { isLocale, type Locale } from './catalog';

/** Pick it/fr/en from Accept-Language; fall back to Italian. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale {
	if (!header) return 'it';
	const tagged = header.split(',').map((part) => {
		const [rawTag, ...params] = part.trim().split(';');
		const tag = rawTag.trim().toLowerCase();
		const q = params.find((param) => param.trim().startsWith('q='));
		const quality = q ? Number(q.split('=')[1]) : 1;
		return { tag, quality: Number.isFinite(quality) ? quality : 0 };
	});
	tagged.sort((a, b) => b.quality - a.quality);
	for (const { tag } of tagged) {
		const base = tag.split('-')[0];
		if (isLocale(base)) return base;
	}
	return 'it';
}
