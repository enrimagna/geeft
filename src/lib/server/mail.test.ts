import { afterEach, describe, expect, it, vi } from 'vitest';
import { passwordChangedMail, passwordResetMail, sendMail } from './mail';

describe('mail templates', () => {
	it('includes the reset url and Italian copy', () => {
		const mail = passwordResetMail({
			email: 'lucile@geeft.app',
			name: 'Lucile',
			locale: 'it',
			url: 'https://geeft.app/reset-password?token=abc'
		});
		expect(mail.subject).toContain('password');
		expect(mail.text).toContain('https://geeft.app/reset-password?token=abc');
		expect(mail.html).toContain('https://geeft.app/reset-password?token=abc');
		expect(mail.html).toContain('Geeft');
	});

	it('falls back to Italian for unknown locale', () => {
		const mail = passwordChangedMail({
			email: 'lucile@geeft.app',
			locale: 'de'
		});
		expect(mail.subject).toBe('La password di Geeft è cambiata');
	});

	it('uses French copy when the profile is French', () => {
		const mail = passwordResetMail({
			email: 'caro@geeft.app',
			locale: 'fr',
			url: 'https://geeft.app/reset-password?token=x'
		});
		expect(mail.subject).toBe('Réinitialisez votre mot de passe Geeft');
		expect(mail.text).toContain('réinitialiser');
	});
});

describe('sendMail', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
		delete process.env.SMTP2GO_API_KEY;
		delete process.env.MAIL_FROM;
	});

	it('skips when the API key is missing', async () => {
		const fetchMock = vi.fn();
		vi.stubGlobal('fetch', fetchMock);
		await sendMail({
			to: 'lucile@geeft.app',
			subject: 'test',
			text: 'hello',
			html: '<p>hello</p>'
		});
		expect(fetchMock).not.toHaveBeenCalled();
	});

	it('posts to SMTP2GO with the API key header', async () => {
		process.env.SMTP2GO_API_KEY = 'test-key';
		process.env.MAIL_FROM = 'Geeft <noreply@geeft.app>';
		const fetchMock = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ data: { email_id: 'x' } })
		});
		vi.stubGlobal('fetch', fetchMock);
		await sendMail({
			to: 'lucile@geeft.app',
			toName: 'Lucile',
			subject: 'test',
			text: 'hello',
			html: '<p>hello</p>'
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
		expect(url).toBe('https://api.smtp2go.com/v3/email/send');
		const headers = init.headers as Record<string, string>;
		expect(headers['X-Smtp2go-Api-Key']).toBe('test-key');
		const body = JSON.parse(String(init.body)) as {
			sender: string;
			to: string[];
			fastaccept: boolean;
		};
		expect(body.sender).toBe('Geeft <noreply@geeft.app>');
		expect(body.to).toEqual(['Lucile <lucile@geeft.app>']);
		expect(body.fastaccept).toBe(true);
	});
});
