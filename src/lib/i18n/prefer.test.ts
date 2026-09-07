import { describe, expect, it } from 'vitest';
import { localeFromAcceptLanguage } from './prefer';

describe('localeFromAcceptLanguage', () => {
	it('prefers French from a typical FR browser', () => {
		expect(localeFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8')).toBe('fr');
	});

	it('picks Italian', () => {
		expect(localeFromAcceptLanguage('it-IT,it;q=0.9,en;q=0.8')).toBe('it');
	});

	it('skips unsupported languages until a known one', () => {
		expect(localeFromAcceptLanguage('de-DE,de;q=0.9,en-US;q=0.8')).toBe('en');
	});

	it('falls back to Italian when nothing matches', () => {
		expect(localeFromAcceptLanguage('de-DE,nl;q=0.8')).toBe('it');
		expect(localeFromAcceptLanguage(null)).toBe('it');
	});
});
