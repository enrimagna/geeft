import { describe, expect, it } from 'vitest';
import { t } from './catalog';

describe('critical i18n', () => {
	it('matches SPEC §9', () => {
		expect(t('it', 'app.receive')).toBe('Ricevi');
		expect(t('fr', 'app.give')).toBe('Offrir');
		expect(t('en', 'gift.reserve.confirm')).toBe('Do you want to reserve this gift?');
		expect(t('fr', 'gift.unreserve.confirm')).toBe('Voulez-vous annuler la réservation ?');
		expect(t('it', 'gift.badge.mine')).toBe('Hai prenotato questo regalo');
		expect(t('it', 'gift.badge.other')).toBe('Qualcuno ha prenotato questo regalo');
		expect(t('it', 'gift.delete.reserved')).toBe(
			"Non puoi eliminare questa idea perché qualcuno l'ha già prenotata"
		);
		expect(t('it', 'action.confirm')).toBe('Conferma');
		expect(t('it', 'app.settings')).toBe('Impostazioni');
		expect(t('fr', 'locale.fr')).toBe('Français');
		expect(t('it', 'gift.unmarkReceived')).toBe('Segna come non ricevuto');
		expect(t('fr', 'gift.unreceive.confirm')).toBe('Voulez-vous annuler le statut reçu ?');
		expect(t('en', 'gift.unmarkReceived')).toBe('Mark as not received');
	});
});
