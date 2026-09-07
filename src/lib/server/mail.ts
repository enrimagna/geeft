import { env } from '$env/dynamic/private';
import { coerceLocale, type Locale } from '$lib/i18n/catalog';

export type MailMessage = {
	to: string;
	toName?: string | null;
	subject: string;
	text: string;
	html: string;
};

const SMTP2GO_URL = 'https://api.smtp2go.com/v3/email/send';

function senderAddress(): string {
	return env.MAIL_FROM?.trim() || process.env.MAIL_FROM?.trim() || 'Geeft <noreply@geeft.app>';
}

export async function sendMail(message: MailMessage): Promise<void> {
	const apiKey = env.SMTP2GO_API_KEY?.trim() || process.env.SMTP2GO_API_KEY?.trim();
	if (!apiKey) {
		console.info('[mail] skipped (no SMTP2GO_API_KEY)', message.subject);
		return;
	}

	const to = message.toName ? `${message.toName} <${message.to}>` : message.to;
	const response = await fetch(SMTP2GO_URL, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			'X-Smtp2go-Api-Key': apiKey
		},
		body: JSON.stringify({
			sender: senderAddress(),
			to: [to],
			subject: message.subject,
			text_body: message.text,
			html_body: message.html,
			fastaccept: true
		})
	});

	const payload = (await response.json().catch(() => null)) as {
		data?: { error?: string; failed?: number; failures?: unknown };
	} | null;

	if (!response.ok) {
		throw new Error(payload?.data?.error || `smtp2go HTTP ${response.status}`);
	}
	if (payload?.data?.error) {
		throw new Error(payload.data.error);
	}
	if ((payload?.data?.failed ?? 0) > 0) {
		throw new Error('smtp2go rejected the message');
	}
}

function wrapHtml(body: string): string {
	return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#FAF7F2;color:#1C1917;">
  <div style="max-width:32rem;margin:0 auto;padding:32px 20px;font-family:Georgia,serif;">
    <p style="margin:0 0 24px;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#5C6B7A;">Geeft</p>
    ${body}
  </div>
</body>
</html>`;
}

function button(href: string, label: string): string {
	return `<p style="margin:28px 0 0;"><a href="${href}" style="display:inline-block;background:#5C6B7A;color:#FAF7F2;text-decoration:none;padding:12px 22px;border-radius:16px;font-family:ui-sans-serif,system-ui,sans-serif;font-size:14px;font-weight:700;">${label}</a></p>`;
}

const copy = {
	reset: {
		subject: {
			it: 'Reimposta la password di Geeft',
			fr: 'Réinitialisez votre mot de passe Geeft',
			en: 'Reset your Geeft password'
		},
		intro: {
			it: 'Hai chiesto di reimpostare la password. Il link scade tra un’ora.',
			fr: 'Vous avez demandé à réinitialiser votre mot de passe. Le lien expire dans une heure.',
			en: 'You asked to reset your password. The link expires in one hour.'
		},
		action: {
			it: 'Scegli una nuova password',
			fr: 'Choisir un nouveau mot de passe',
			en: 'Choose a new password'
		},
		ignore: {
			it: 'Se non sei stato tu, ignora questa email: la password resta com’è.',
			fr: 'Si ce n’était pas vous, ignorez cet e-mail : le mot de passe ne change pas.',
			en: 'If this wasn’t you, ignore this email — your password stays the same.'
		}
	},
	changed: {
		subject: {
			it: 'La password di Geeft è cambiata',
			fr: 'Votre mot de passe Geeft a changé',
			en: 'Your Geeft password changed'
		},
		intro: {
			it: 'La password del tuo account Geeft è stata aggiornata.',
			fr: 'Le mot de passe de votre compte Geeft a été mis à jour.',
			en: 'The password on your Geeft account was updated.'
		},
		ignore: {
			it: 'Se non sei stato tu, reimposta subito la password dalla schermata di accesso.',
			fr: 'Si ce n’était pas vous, réinitialisez le mot de passe depuis l’écran de connexion.',
			en: 'If this wasn’t you, reset the password from the sign-in screen right away.'
		}
	}
} as const;

export function passwordResetMail(input: {
	email: string;
	name?: string | null;
	locale?: string | null;
	url: string;
}): MailMessage {
	const locale: Locale = coerceLocale(input.locale);
	const c = copy.reset;
	const text = `${c.intro[locale]}\n\n${input.url}\n\n${c.ignore[locale]}`;
	const html = wrapHtml(
		`<p style="margin:0 0 12px;font-size:18px;line-height:1.45;">${c.intro[locale]}</p>
		${button(input.url, c.action[locale])}
		<p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:#5C6B7A;">${c.ignore[locale]}</p>`
	);
	return {
		to: input.email,
		toName: input.name,
		subject: c.subject[locale],
		text,
		html
	};
}

export function passwordChangedMail(input: {
	email: string;
	name?: string | null;
	locale?: string | null;
}): MailMessage {
	const locale: Locale = coerceLocale(input.locale);
	const c = copy.changed;
	const text = `${c.intro[locale]}\n\n${c.ignore[locale]}`;
	const html = wrapHtml(
		`<p style="margin:0 0 12px;font-size:18px;line-height:1.45;">${c.intro[locale]}</p>
		<p style="margin:28px 0 0;font-size:14px;line-height:1.5;color:#5C6B7A;">${c.ignore[locale]}</p>`
	);
	return {
		to: input.email,
		toName: input.name,
		subject: c.subject[locale],
		text,
		html
	};
}

export function queueMail(message: MailMessage): void {
	void sendMail(message).catch((error) => {
		const detail = error instanceof Error ? error.message : 'unknown';
		console.error('[mail] send failed', detail);
	});
}
