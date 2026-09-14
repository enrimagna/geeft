import { describe, expect, it } from 'vitest';
import { hostMatches, rewriteAffiliateUrl, type AffiliateNetworkRule } from './affiliate';

const amazonIt: AffiliateNetworkRule = {
	id: 'net-it',
	key: 'amazon_it',
	name: 'Amazon IT',
	enabled: true,
	priority: 10,
	hostPatterns: ['amazon.it', 'www.amazon.it', 'amzn.eu'],
	tagParam: 'tag',
	tagValue: 'geeft-21',
	extraParams: null
};

const amazonFr: AffiliateNetworkRule = {
	id: 'net-fr',
	key: 'amazon_fr',
	name: 'Amazon FR',
	enabled: true,
	priority: 20,
	hostPatterns: ['amazon.fr', 'www.amazon.fr'],
	tagParam: 'tag',
	tagValue: 'geeftfr-21',
	extraParams: null
};

describe('hostMatches', () => {
	it('matches exact and subdomain hosts', () => {
		expect(hostMatches('amazon.it', 'amazon.it')).toBe(true);
		expect(hostMatches('www.amazon.it', 'amazon.it')).toBe(true);
		expect(hostMatches('smile.amazon.it', 'amazon.it')).toBe(true);
		expect(hostMatches('amazon.com', 'amazon.it')).toBe(false);
	});
});

describe('rewriteAffiliateUrl', () => {
	it('leaves non-Amazon urls intact', () => {
		const result = rewriteAffiliateUrl('https://example.com/taccuino', [amazonIt], {
			enabled: true
		});
		expect(result.rewritten).toBe(false);
		expect(result.networkId).toBeNull();
		expect(result.url).toBe('https://example.com/taccuino');
		expect(result.host).toBe('example.com');
	});

	it('adds Amazon tag on matching host', () => {
		const result = rewriteAffiliateUrl(
			'https://www.amazon.it/dp/B0TEST?ref=abc',
			[amazonIt, amazonFr],
			{ enabled: true }
		);
		expect(result.rewritten).toBe(true);
		expect(result.networkId).toBe('net-it');
		const url = new URL(result.url);
		expect(url.searchParams.get('tag')).toBe('geeft-21');
		expect(url.pathname).toBe('/dp/B0TEST');
		expect(url.searchParams.get('ref')).toBe('abc');
	});

	it('does not rewrite when global flag is off', () => {
		const result = rewriteAffiliateUrl('https://www.amazon.it/dp/B0TEST', [amazonIt], {
			enabled: false
		});
		expect(result.rewritten).toBe(false);
		expect(result.url).toBe('https://www.amazon.it/dp/B0TEST');
		expect(result.networkId).toBeNull();
	});

	it('returns empty result for missing gift url', () => {
		const result = rewriteAffiliateUrl('', [amazonIt], { enabled: true });
		expect(result.url).toBe('');
		expect(result.rewritten).toBe(false);
		expect(result.host).toBe('');
	});

	it('does not convert .com stores to .it', () => {
		const result = rewriteAffiliateUrl('https://www.amazon.com/dp/B0TEST', [amazonIt], {
			enabled: true
		});
		expect(result.rewritten).toBe(false);
		expect(result.url).toBe('https://www.amazon.com/dp/B0TEST');
	});

	it('skips disabled networks and empty tags', () => {
		const disabled = { ...amazonIt, enabled: false };
		const emptyTag = { ...amazonIt, tagValue: '' };
		expect(
			rewriteAffiliateUrl('https://amazon.it/x', [disabled], { enabled: true }).rewritten
		).toBe(false);
		expect(
			rewriteAffiliateUrl('https://amazon.it/x', [emptyTag], { enabled: true }).rewritten
		).toBe(false);
	});

	it('does not rewrite non-http schemes', () => {
		const result = rewriteAffiliateUrl('ftp://amazon.it/file', [amazonIt], { enabled: true });
		expect(result.rewritten).toBe(false);
	});
});
