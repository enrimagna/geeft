# SPEC — Geeft rebuild

> **Privacy is the product.** Se il destinatario scopre chi ha prenotato un regalo, l’implementazione è errata.

## §1 Product vision

Geeft è una piccola app familiare per liste regalo di Natale. Ogni persona raccoglie le proprie idee e può segnare ciò che ha ricevuto (**Receive**); guardando le idee degli altri (**Give**) può prenotare un regalo, lasciare una nota privata o preparare una sorpresa nascosta. Il prodotto riduce i doppioni senza rovinare la sorpresa.

Target: famiglie invitate, uso mobile-first, italiano predefinito con francese e inglese. L’app deve essere semplice: un processo Node, un file SQLite, nessun GraphQL.

## §2 Users & modes

Un utente autenticato appartiene a una o più famiglie tramite `family_member`; dati e autorizzazioni sono limitati alla famiglia corrente. Un invite code consente di entrare senza rendere pubblica la famiglia.

Alla registrazione viene creata una lista personale con `name = first_name`, `is_personal = true`, `hide_reserved = true`, e appartenenza alla famiglia scelta/invitata secondo il flusso di signup.

### Receive mode — my lists

L’utente vede e modifica le proprie idee: crea, aggiorna, apre il titolo completo e marca un regalo come ricevuto. **Non vede mai** chi ha prenotato, commenti, né regali con `hidden_from_recipient=1`. Può cancellare solo un’idea non prenotata; se prenotata riceve 409.

### Give mode — other family lists

L’utente vede le liste degli altri membri autorizzati, non la propria lista come destinatario. Può prenotare e togliere la propria prenotazione dopo conferma, vedere lo stato e, per gli altri giver, eventualmente il first name del reserver. Può aggiungere commenti privati e creare un regalo segreto (`hidden_from_recipient=1`). Il destinatario non riceve mai questi dati.

## §3 Stack

- SvelteKit 2, TypeScript, Vite, PWA.
- Tailwind CSS + DaisyUI, tema `fantasy`.
- Drizzle ORM + `better-sqlite3`.
- SQLite `data/geeft.sqlite`; eseguire `PRAGMA journal_mode=WAL` e `PRAGMA foreign_keys=ON` per ogni connessione.
- Better Auth email/password, sessioni via cookie httpOnly (Secure in produzione, SameSite appropriato).
- i18n: `it` default, `fr`, `en`.
- `vite-plugin-pwa` per manifest/service worker/icons.
- TDM: un processo Node, un file SQLite, nessun GraphQL o servizio esterno necessario.

## §4 Authorization & visibility matrix

I filtri sono applicati nelle query server-side prima della serializzazione. Un campo non autorizzato non compare in payload, HTML SSR, endpoint, conteggio o errore.

| Actor/context | Lista e idee | `reserved_by` / identità | Stato prenotazione | Commenti | `hidden_from_recipient=1` |
|---|---|---|---|---|---|
| Destinatario in Receive, propria lista | Titolo, descrizione, URL, `received_at`, stato ricevuto e proprie mutazioni | **Mai** id/nome; può sapere solo che l’idea non è eliminabile se la delete risponde 409 | Non mostrare chi; nessun conteggio rivelatore | **Mai** | Record completamente escluso |
| Destinatario via API diretta | Solo risorse proprie ammesse | Mai nel response; errori non rivelano reserver | Nessun dettaglio Give | Mai | Sempre escluso |
| Altro membro in Give, lista altrui | Idee non segrete della famiglia autorizzata | Stato sì; first name del reserver solo nel contesto Give autorizzato | Sì | Commenti privati per giver autorizzati | Visibile ai giver autorizzati, mai al destinatario |
| Reserver in Give | Idea prenotata | Può vedere il proprio stato/identità | Può unreserve solo la propria prenotazione | Propri commenti secondo policy | Può vedere la propria sorpresa |
| Non membro della famiglia | Nessun dato | Nessun campo | Nessun campo | Nessun campo | Nessun campo |
| Log server | Minimo necessario | Non loggare identità/secret inutilmente | — | Non loggare testo privato | Non loggare contenuto segreto |

Badge Give obbligatori: me → IT `Hai prenotato questo regalo`, FR `Vous avez réservé ce cadeau`, EN `You reserved this gift`; someone else → IT `Qualcuno ha prenotato questo regalo`, FR `Quelqu'un a réservé ce cadeau`, EN `Someone reserved this gift`. Il destinatario non vede questi badge con identità e Receive omette il campo sottostante.

## §5 Data model

Usare UUID/text IDs oppure integer IDs in modo coerente. Timestamp in UTC ISO string o integer epoch, con una sola convenzione. Tipi indicati sono Drizzle/SQLite raccomandati.

### `user`

- `id TEXT PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `first_name TEXT NOT NULL`
- `last_name TEXT NULL`
- `locale TEXT NOT NULL DEFAULT 'it'` (check `it|fr|en`)
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`

Better Auth gestisce password hash e account; mai password in chiaro.

### Better Auth tables

Creare le tabelle richieste dall’adapter Better Auth, tipicamente `session`, `account`, `verification` (e le colonne esatte della versione installata), con FK a `user`, scadenze e indici su token/email. Cookie httpOnly. Non reinventare l’autenticazione né esporre token nei payload applicativi.

### `family`

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `invite_code TEXT NOT NULL UNIQUE` (confronto/hash secondo implementazione; non mostrare a non membri)
- `created_at INTEGER/TEXT NOT NULL`

### `family_member`

- `family_id TEXT NOT NULL REFERENCES family(id) ON DELETE CASCADE`
- `user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `role TEXT NOT NULL DEFAULT 'member'` (`owner|member`)
- `joined_at INTEGER/TEXT NOT NULL`
- PK (`family_id`, `user_id`); index su `user_id` e `family_id`.

### `gift_list`

- `id TEXT PRIMARY KEY`
- `family_id TEXT NOT NULL REFERENCES family(id) ON DELETE CASCADE`
- `owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `is_personal INTEGER NOT NULL DEFAULT 1` (boolean 0/1)
- `hide_reserved INTEGER NOT NULL DEFAULT 1` (boolean 0/1)
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`
- UNIQUE (`family_id`, `owner_id`, `name`); indexes on (`family_id`, `owner_id`).

### `gift`

- `id TEXT PRIMARY KEY`
- `list_id TEXT NOT NULL REFERENCES gift_list(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `description TEXT NULL`
- `url TEXT NULL`
- `reserved_by TEXT NULL REFERENCES user(id) ON DELETE SET NULL`
- `reserved_at INTEGER/TEXT NULL`
- `received_at INTEGER/TEXT NULL`
- `hidden_from_recipient INTEGER NOT NULL DEFAULT 0` (boolean 0/1)
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`
- indexes on `list_id`, `reserved_by`, `hidden_from_recipient`, and (`list_id`, `created_at`, `id`).

`reserved_by` è nullable. Delete consentita solo se NULL; altrimenti transazione 409. `received_at` è stato del destinatario, non prenotazione.

### `gift_comment`

- `id TEXT PRIMARY KEY`
- `gift_id TEXT NOT NULL REFERENCES gift(id) ON DELETE CASCADE`
- `author_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `body TEXT NOT NULL`
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`
- index su (`gift_id`, `created_at`) e `author_id`.

I commenti sono coordinamento privato per giver autorizzati; mai joinarli in una query Receive.

## §6 Behaviors P1 and P2

### P1.1 Reservation badges

In Give, after server authorization: current user → `Hai prenotato questo regalo` / `Vous avez réservé ce cadeau` / `You reserved this gift`; someone else → `Qualcuno ha prenotato questo regalo` / `Quelqu'un a réservé ce cadeau` / `Someone reserved this gift`. Il first name di un altro giver è ammesso solo in Give, mai quando il viewer è il destinatario. Receive omette il campo.

### P1.2 Confirmation

Prima di reserve **e** unreserve mostra una dialog. Reserve: IT `Vuoi prenotare questo regalo?`; FR `Voulez-vous prendre ce cadeau ?`; EN `Do you want to take this gift?`. Unreserve: IT `Vuoi annullare la prenotazione?`; FR `Voulez-vous annuler la réservation ?`; EN `Do you want to cancel the reservation?`. Pulsanti localizzati Cancel e Confirm. Nessuna mutazione prima di Confirm; il server ripete i controlli.

### P1.3 Stable card position

Ogni lista usa `ORDER BY created_at ASC, id ASC`. Render con `{#each gifts as gift (gift.id)}`. Reservation è update ottimistico in-place riconciliato dal server: non riordinare, rimontare, fare fade o cambiare altezza. Usare altezza fissa/minima e skeleton stabile.

### P1.4 Protected delete

Receive delete controlla `reserved_by IS NULL` nella stessa transazione. Se non nullo HTTP 409 e:

- IT `Non puoi eliminare questa idea perché qualcuno l'ha già prenotata`
- FR `Vous ne pouvez pas supprimer cette idée car quelqu'un l'a déjà réservée`
- EN `You cannot delete this idea because someone has already reserved it`

Non rivelare chi ha prenotato.

### P2.1 Secret gift

Un’azione Give-only può impostare `hidden_from_recipient=1`. Resta disponibile ai giver autorizzati, ma ogni query/response Receive lo esclude. Non affidarsi a filtro frontend.

### P2.2 Long titles

Card title con CSS `line-clamp-2` e altezza fissa; modal/dettaglio mostra titolo e descrizione completi. Un titolo lungo non deve spostare le card vicine.

## §7 Screens

1. **Login**: email, password, selettore lingua, errori accessibili e cookie sessione.
2. **Signup**: first name, last name opzionale, email, password, locale, invite code; crea lista personale con flag richiesti.
3. **Receive**: proprie liste, add/edit/delete idea, titolo/descrizione/URL, mark received, stato safe; niente commenti, reserver o dati secret.
4. **Give**: selettore membri/liste escludendo la propria lista come destinatario, card stabili, badge, dialog reserve/unreserve, commento, secret gift.
5. **Gift modal**: titolo completo, descrizione, URL, campi ammessi; nessun dato non autorizzato in SSR/client state.
6. **Confirm dialogs**: reserve e unreserve, Cancel/Confirm, keyboard accessible, traduzioni esatte.
7. **Family invite**: mostra/crea/copia invite code solo a membri autorizzati; join valida server-side e crea membership.
8. **Bottom nav**: Receive, Give, family/profile; target ≥44px; responsive 390px.

## §8 API sketch

Implementare come SvelteKit form actions e/o `+server.ts` REST. Tutte le route richiedono sessione Better Auth salvo login/signup.

| Operation | Method/path esempio | Auth/visibility | Success | Errori |
|---|---|---|---|---|
| List Receive gifts | `GET /api/receive/lists/:listId/gifts` | owner + family member; esclude secret, reserver, comments | 200 filtered list sorted `created_at ASC, id ASC` | 401, 403, 404 |
| List Give gifts | `GET /api/give/lists/:listId/gifts` | family member; metadata permitted | 200 | 401, 403, 404 |
| Create own gift | `POST /api/lists/:listId/gifts` | owner in Receive; secret solo Give | 201 | 401, 403, 404, 422 |
| Update own gift | `PATCH /api/gifts/:giftId` | list owner | 200 | 401, 403, 404, 422 |
| Delete own gift | `DELETE /api/gifts/:giftId` | owner; transaction richiede NULL | 204 | 401, 403, 404, **409 reserved**, 422 |
| Reserve | `POST /api/gifts/:giftId/reserve` | family giver; non propria lista; conditional null guard | 200/201 | 401, 403, 404, **409 already reserved**, 422 |
| Unreserve | `POST /api/gifts/:giftId/unreserve` | solo current reserver; confirmed client-side | 200 | 401, 403, 404, **409 not yours/state changed**, 422 |
| Add secret gift | `POST /api/give/lists/:listId/secret-gifts` | family giver, recipient altro membro; forza flag | 201 | 401, 403, 404, 409, 422 |
| List comments | `GET /api/gifts/:giftId/comments` | giver context autorizzato | 200 | 401, 403, 404 |
| Add comment | `POST /api/gifts/:giftId/comments` | giver context autorizzato | 201 | 401, 403, 404, 422 |
| Family join | `POST /api/families/join` | authenticated; code server-side | 201/200 | 401, 403, 404 invalid, 409 member, 422 |

Status: `401` no session; `403` sessione ma vietato; `404` missing o intenzionalmente inaccessible senza leak; `409` conflitto di stato; `422` input invalido. Risposte user-facing localizzate e sempre prive di campi vietati.

Reservation atomica: transaction con `UPDATE gift SET reserved_by=?, reserved_at=? WHERE id=? AND reserved_by IS NULL`; zero righe = 409. Unreserve protegge con `reserved_by = currentUser.id`. Tutte le mutation validano membership, ownership e modo.

## §9 i18n keys for critical strings

Usare chiavi stabili, non testo hard-coded. Catalog minimo:

```text
app.receive = { it: "Ricevi", fr: "Recevoir", en: "Receive" }
app.give = { it: "Regala", fr: "Offrir", en: "Give" }
gift.reserve.confirm = { it: "Vuoi prenotare questo regalo?", fr: "Voulez-vous prendre ce cadeau ?", en: "Do you want to take this gift?" }
gift.unreserve.confirm = { it: "Vuoi annullare la prenotazione?", fr: "Voulez-vous annuler la réservation ?", en: "Do you want to cancel this reservation?" }
gift.badge.mine = { it: "Hai prenotato questo regalo", fr: "Vous avez réservé ce cadeau", en: "You reserved this gift" }
gift.badge.other = { it: "Qualcuno ha prenotato questo regalo", fr: "Quelqu'un a réservé ce cadeau", en: "Someone reserved this gift" }
gift.delete.reserved = { it: "Non puoi eliminare questa idea perché qualcuno l'ha già prenotata", fr: "Vous ne pouvez pas supprimer cette idée car quelqu'un l'a déjà réservée", en: "You cannot delete this idea because someone has already reserved it" }
action.cancel = { it: "Annulla", fr: "Annuler", en: "Cancel" }
action.confirm = { it: "Conferma", fr: "Confirmer", en: "Confirm" }
action.reserve = { it: "Prenota", fr: "Réserver", en: "Reserve" }
action.unreserve = { it: "Annulla prenotazione", fr: "Annuler la réservation", en: "Unreserve" }
```

Aggiungere login, signup, validation, received state, invite, comments e accessibility labels. Fallback italiano; missing critical translations falliscono i test.

## §10 Seed data

Family: name `Familia`, con invite code deterministico per sviluppo locale, non visibile ai non membri.

Account seed, tutti con password locale `geeft123`:

- `lucile@geeft.local`
- `enrico@geeft.local`
- `caroline@geeft.local`

Creare una lista personale per ogni utente, nominata con `first_name`, `is_personal=1`, `hide_reserved=1`, e aggiungere tutti e tre a `Familia`. Inserire sample gifts che coprano: idea libera, idea di Lucile prenotata da Enrico, idea ricevuta, titolo lungo, URL, commento giver-visible non secret e almeno un gift `hidden_from_recipient=1`. Il gift hidden deve essere assente dalla response Receive di Lucile. Password e invite seed sono fixture locali, mai produzione.

## §11 Acceptance checklist

- [ ] SvelteKit 2 TypeScript PWA con Tailwind/DaisyUI `fantasy` e asset originali.
- [ ] SQLite è `data/geeft.sqlite`, usa WAL e `foreign_keys=ON`; schema/migrations Drizzle riproducibili.
- [ ] Better Auth email/password funziona con cookie httpOnly; chiamate server senza sessione rispondono 401.
- [ ] Signup crea lista nominata correttamente con `is_personal=true`, `hide_reserved=true`; invite membership enforced.
- [ ] `it` default e `fr`/`en` funzionano per UI ed errori critici.
- [ ] Receive restituisce solo proprie idee permesse, ordine `created_at ASC, id ASC`; payload/SSR non contiene reserver, commenti o secret gifts.
- [ ] Give mostra solo membri autorizzati e i due badge esatti in tutte le lingue.
- [ ] Il destinatario non vede mai identità del reserver; API dirette non bypassano la regola.
- [ ] Reserve richiede conferma, è atomico e la gara restituisce 409.
- [ ] Unreserve richiede conferma e solo il current reserver può farlo.
- [ ] Delete di idea prenotata restituisce 409 con messaggio localizzato senza nominare il reserver.
- [ ] Secret gift forza `hidden_from_recipient=1`; Receive non lo include mai.
- [ ] Card keyed per gift id, stabile in-place, altezza fissa/minima, senza fade/remount/reorder su optimistic reserve.
- [ ] Titoli card usano `line-clamp-2`; modal mostra titolo completo.
- [ ] Login, signup, Receive, Give, modal, dialog, invite e bottom nav funzionano a 390px; target ≥44px.
- [ ] Commenti sono dati privati dei giver e protetti server-side.
- [ ] Seed contiene Familia, tre account, liste personali e sample rappresentativi.
- [ ] Test coprono visibility matrix, status 401/403/404/409/422, race reservation, secret exclusion, i18n, schema e build.
- [ ] I comandi di check, lint, test e build passano; i cinque passi privacy in COME_USARE.md passano.
