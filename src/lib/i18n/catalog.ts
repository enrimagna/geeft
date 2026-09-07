export const locales = ['it', 'fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export function isLocale(value: string | null | undefined): value is Locale {
	return value === 'it' || value === 'fr' || value === 'en';
}

export function coerceLocale(value: string | null | undefined): Locale {
	return isLocale(value) ? value : 'it';
}

const catalog = {
	'app.receive': { it: 'Ricevi', fr: 'Recevoir', en: 'Receive' },
	'app.give': { it: 'Regala', fr: 'Offrir', en: 'Give' },
	'app.family': { it: 'Famiglia', fr: 'Famille', en: 'Family' },
	'app.settings': { it: 'Impostazioni', fr: 'Réglages', en: 'Settings' },
	'app.tagline': {
		it: 'La sorpresa resta una sorpresa.',
		fr: 'La surprise reste une surprise.',
		en: 'The surprise stays a surprise.'
	},
	'gift.reserve.confirm': {
		it: 'Vuoi prenotare questo regalo?',
		fr: 'Voulez-vous réserver ce cadeau ?',
		en: 'Do you want to reserve this gift?'
	},
	'gift.unreserve.confirm': {
		it: 'Vuoi annullare la prenotazione?',
		fr: 'Voulez-vous annuler la réservation ?',
		en: 'Do you want to cancel the reservation?'
	},
	'gift.badge.mine': {
		it: 'Hai prenotato questo regalo',
		fr: 'Vous avez réservé ce cadeau',
		en: 'You reserved this gift'
	},
	'gift.badge.other': {
		it: 'Qualcuno ha prenotato questo regalo',
		fr: "Quelqu'un a réservé ce cadeau",
		en: 'Someone reserved this gift'
	},
	'gift.delete.reserved': {
		it: "Non puoi eliminare questa idea perché qualcuno l'ha già prenotata",
		fr: "Vous ne pouvez pas supprimer cette idée car quelqu'un l'a déjà réservée",
		en: 'You cannot delete this idea because someone has already reserved it'
	},
	'gift.edit.reserved': {
		it: 'Questa idea è già prenotata e non si può modificare.',
		fr: 'Cette idée est déjà réservée et ne peut plus être modifiée.',
		en: 'This idea is already reserved and cannot be edited.'
	},
	'gift.reserve.conflict': {
		it: 'Questo regalo non è più disponibile.',
		fr: "Ce cadeau n'est plus disponible.",
		en: 'This gift is no longer available.'
	},
	'gift.received': { it: 'Ricevuto', fr: 'Reçu', en: 'Received' },
	'gift.markReceived': {
		it: 'Segna come ricevuto',
		fr: 'Marquer comme reçu',
		en: 'Mark as received'
	},
	'gift.secret': { it: 'Sorpresa', fr: 'Surprise', en: 'Surprise' },
	'gift.secret.hint': {
		it: 'Solo chi regala la vede. Prenotala se vuoi occupartene tu.',
		fr: 'Seuls les offreurs la voient. Réservez-la si vous voulez vous en occuper.',
		en: 'Only givers see it. Reserve it if you want to take care of it.'
	},
	'gift.add': { it: 'Aggiungi un desiderio', fr: 'Ajouter un souhait', en: 'Add a wish' },
	'gift.addSecret': {
		it: 'Prepara una sorpresa',
		fr: 'Préparer une surprise',
		en: 'Prepare a surprise'
	},
	'gift.title': { it: 'Titolo', fr: 'Titre', en: 'Title' },
	'gift.description': { it: 'Descrizione', fr: 'Description', en: 'Description' },
	'gift.url': { it: 'Link', fr: 'Lien', en: 'Link' },
	'gift.delete': { it: 'Elimina', fr: 'Supprimer', en: 'Delete' },
	'gift.withdraw': { it: 'Ritira la sorpresa', fr: 'Retirer la surprise', en: 'Withdraw surprise' },
	'gift.deliver': { it: 'Segna consegnato', fr: 'Marquer comme remis', en: 'Mark delivered' },
	'gift.openLink': { it: 'Apri il link', fr: 'Ouvrir le lien', en: 'Open link' },
	'action.cancel': { it: 'Annulla', fr: 'Annuler', en: 'Cancel' },
	'action.confirm': { it: 'Conferma', fr: 'Confirmer', en: 'Confirm' },
	'action.reserve': { it: 'Prenota', fr: 'Réserver', en: 'Reserve' },
	'action.unreserve': { it: 'Annulla prenotazione', fr: 'Annuler la réservation', en: 'Unreserve' },
	'action.save': { it: 'Salva', fr: 'Enregistrer', en: 'Save' },
	'action.close': { it: 'Chiudi', fr: 'Fermer', en: 'Close' },
	'action.copy': { it: 'Copia', fr: 'Copier', en: 'Copy' },
	'action.logout': { it: 'Esci', fr: 'Se déconnecter', en: 'Log out' },
	'auth.login': { it: 'Entra', fr: 'Connexion', en: 'Log in' },
	'auth.signup': { it: 'Crea account', fr: 'Créer un compte', en: 'Create account' },
	'auth.email': { it: 'Email', fr: 'E-mail', en: 'Email' },
	'auth.password': { it: 'Password', fr: 'Mot de passe', en: 'Password' },
	'auth.firstName': { it: 'Nome', fr: 'Prénom', en: 'First name' },
	'auth.lastName': { it: 'Cognome (opzionale)', fr: 'Nom (optionnel)', en: 'Last name (optional)' },
	'auth.invite': { it: 'Codice invito', fr: "Code d'invitation", en: 'Invite code' },
	'auth.noAccount': {
		it: 'Prima volta? Entra con un invito.',
		fr: 'Première fois ? Entrez avec une invitation.',
		en: 'First time? Join with an invite.'
	},
	'auth.hasAccount': {
		it: 'Hai già un account? Entra.',
		fr: 'Déjà un compte ? Connectez-vous.',
		en: 'Already have an account? Log in.'
	},
	'auth.error': {
		it: 'Email o password non validi.',
		fr: 'E-mail ou mot de passe invalide.',
		en: 'Invalid email or password.'
	},
	'auth.invite.invalid': {
		it: 'Invito non valido.',
		fr: 'Invitation invalide.',
		en: 'Invalid invite.'
	},
	'auth.invite.required': {
		it: 'Serve un codice invito.',
		fr: "Un code d'invitation est requis.",
		en: 'An invite code is required.'
	},
	'comment.add': { it: 'Nota privata', fr: 'Note privée', en: 'Private note' },
	'comment.placeholder': {
		it: 'Solo chi regala la legge…',
		fr: 'Seuls les offreurs la lisent…',
		en: 'Only givers can read this…'
	},
	'comment.delete': { it: 'Elimina nota', fr: 'Supprimer la note', en: 'Delete note' },
	'family.current': { it: 'Famiglia corrente', fr: 'Famille actuelle', en: 'Current family' },
	'family.switch': {
		it: 'Passa a questa famiglia',
		fr: 'Choisir cette famille',
		en: 'Switch to this family'
	},
	'family.create': { it: 'Nuova famiglia', fr: 'Nouvelle famille', en: 'New family' },
	'family.name': { it: 'Nome della famiglia', fr: 'Nom de la famille', en: 'Family name' },
	'family.join': {
		it: 'Unisciti con un codice',
		fr: 'Rejoindre avec un code',
		en: 'Join with a code'
	},
	'family.invite': { it: 'Invito', fr: 'Invitation', en: 'Invite' },
	'family.regenerate': { it: 'Nuovo codice', fr: 'Nouveau code', en: 'New code' },
	'family.owner': { it: 'Titolare', fr: 'Responsable', en: 'Owner' },
	'settings.language': { it: 'Lingua', fr: 'Langue', en: 'Language' },
	'settings.profile': { it: 'Profilo', fr: 'Profil', en: 'Profile' },
	'settings.family.hint': {
		it: 'Famiglie, inviti e switch.',
		fr: 'Familles, invitations et changement.',
		en: 'Families, invites and switching.'
	},
	'settings.lists': { it: 'Liste gestite', fr: 'Listes gérées', en: 'Managed lists' },
	'settings.lists.hint': {
		it: 'Bambini, liste comuni, chi non ha un account.',
		fr: 'Enfants, listes partagées, personnes sans compte.',
		en: 'Children, shared lists, people without an account.'
	},
	'lists.create': { it: 'Nuova lista', fr: 'Nouvelle liste', en: 'New list' },
	'lists.name': { it: 'Nome della lista', fr: 'Nom de la liste', en: 'List name' },
	'lists.admins': { it: 'Amministratori', fr: 'Administrateurs', en: 'Admins' },
	'lists.addAdmin': {
		it: 'Aggiungi amministratore',
		fr: 'Ajouter un administrateur',
		en: 'Add admin'
	},
	'lists.removeAdmin': { it: 'Rimuovi', fr: 'Retirer', en: 'Remove' },
	'lists.delete': { it: 'Elimina lista', fr: 'Supprimer la liste', en: 'Delete list' },
	'lists.duplicate': {
		it: 'Esiste già una lista con questo nome.',
		fr: 'Une liste avec ce nom existe déjà.',
		en: 'A list with this name already exists.'
	},
	'lists.alreadyAdmin': {
		it: 'Questa persona amministra già la lista.',
		fr: 'Cette personne administre déjà la liste.',
		en: 'This person already administers the list.'
	},
	'lists.lastAdmin': {
		it: 'Serve almeno un amministratore.',
		fr: 'Il faut au moins un administrateur.',
		en: 'At least one admin is required.'
	},
	'lists.empty': {
		it: 'Nessuna lista gestita. Creane una per un bambino o una lista comune.',
		fr: 'Aucune liste gérée. Créez-en une pour un enfant ou une liste partagée.',
		en: 'No managed lists yet. Create one for a child or a shared list.'
	},
	'lists.you': { it: 'Tu', fr: 'Vous', en: 'You' },
	'lists.share': {
		it: 'Visibile in queste famiglie',
		fr: 'Visible dans ces familles',
		en: 'Visible in these families'
	},
	'lists.share.hint': {
		it: 'I tuoi regali personali restano in tutte le famiglie. Qui scegli dove compare questa lista gestita.',
		fr: 'Vos cadeaux personnels restent dans toutes les familles. Ici vous choisissez où apparaît cette liste gérée.',
		en: 'Your personal gifts stay in every family. Here you choose where this managed list appears.'
	},
	'lists.needFamily': {
		it: 'Scegli almeno una famiglia.',
		fr: 'Choisissez au moins une famille.',
		en: 'Pick at least one family.'
	},
	'locale.it': { it: 'Italiano', fr: 'Italien', en: 'Italian' },
	'locale.fr': { it: 'Francese', fr: 'Français', en: 'French' },
	'locale.en': { it: 'Inglese', fr: 'Anglais', en: 'English' },
	'action.back': { it: 'Indietro', fr: 'Retour', en: 'Back' },
	'empty.receive': {
		it: 'La lista è ancora un foglio bianco. Aggiungi il primo desiderio.',
		fr: 'La liste est encore une page blanche. Ajoutez le premier souhait.',
		en: 'The list is still a blank page. Add the first wish.'
	},
	'empty.give': {
		it: 'Nessun desiderio in vista. Qualcun altro deve ancora scrivere.',
		fr: 'Aucun souhait pour le moment. Quelqu’un d’autre n’a pas encore écrit.',
		en: 'No wishes here yet. Someone still has to write one.'
	},
	'error.unauthorized': {
		it: 'Non puoi farlo.',
		fr: 'Action non autorisée.',
		en: 'You cannot do that.'
	},
	'error.notFound': { it: 'Non trovato.', fr: 'Introuvable.', en: 'Not found.' },
	'error.generic': {
		it: 'Qualcosa è andato storto.',
		fr: "Quelque chose s'est mal passé.",
		en: 'Something went wrong.'
	},
	'error.validation': {
		it: 'Controlla i campi.',
		fr: 'Vérifiez les champs.',
		en: 'Check the fields.'
	}
} as const;

export type MessageKey = keyof typeof catalog;

export function t(locale: string | null | undefined, key: MessageKey): string {
	const loc = coerceLocale(locale);
	const entry = catalog[key];
	if (!entry) return String(key);
	return entry[loc];
}
