# SPEC — Geeft rebuild

> **Privacy is the product.** Se il destinatario scopre chi ha prenotato un regalo, l’implementazione è errata.

## §1 Product vision

Geeft è una piccola app familiare per liste regalo. Ogni persona raccoglie le proprie idee e può segnare ciò che ha ricevuto (**Receive**); guardando le idee degli altri (**Give**) può prenotare un regalo, lasciare una nota privata o preparare una sorpresa nascosta. Il prodotto riduce i doppioni senza rovinare la sorpresa.

Uso generico: compleanni, nascite, matrimoni, liste di famiglia. **Non è un’app di Natale**: niente copy, iconografia o palette natalizia.

Target: famiglie invitate (signup solo con invite), più famiglie per utente, uso mobile-first, italiano predefinito con francese e inglese. L’app deve essere semplice: un processo Node, un file SQLite, nessun GraphQL.

## §2 Users & modes

Un utente autenticato appartiene a una o più famiglie tramite `family_member`. Dati e autorizzazioni sono limitati alla **famiglia corrente** (`user.current_family_id`). Lo switch famiglia è esplicito e validato server-side: la famiglia deve essere una membership dell’utente.

**Signup è invite-only.** Non si crea una famiglia in registrazione. Serve un invite code valido; l’utente entra come `member`, ottiene una lista personale in quella famiglia e `current_family_id` punta lì.

Dopo il login, un utente può: entrare in un’altra famiglia con un invite; creare una famiglia aggiuntiva (diventa `owner`, riceve un codice, ottiene una lista personale in quella famiglia). Lo seed di sviluppo fornisce la prima famiglia.

### Receive mode — my lists

L’utente vede e modifica le proprie idee nella famiglia corrente: crea, aggiorna (se non prenotata), apre il titolo completo e marca un regalo come ricevuto. **Non vede mai** chi ha prenotato, commenti, né regali con `hidden_from_recipient=1`. Può cancellare solo un’idea non prenotata; se prenotata riceve 409. La card Receive è identica per idee libere e prenotate: niente cestino disabilitato, niente copy diverso, niente stato “prenotato” — il 409 è l’unico oracolo.

Oltre alla lista personale, in Receive appaiono le **liste gestite** di cui è amministratore (es. Alba). Stesse mutazioni e stessa cecità: gli admin non vedono prenotazioni né secret.

### Give mode — other family lists

L’utente vede le liste degli altri membri della famiglia corrente e le liste gestite di cui **non** è admin. Non vede la propria lista personale né le gestite che amministra. Può prenotare e togliere la propria prenotazione dopo conferma, vedere lo stato **anonimo** (libero / io / qualcuno), aggiungere commenti privati e creare un regalo segreto. Il first name o l’id del reserver **non** compaiono in Give.

### Liste gestite

Per bambini, chi non ha un account, o liste comuni. Si creano in Impostazioni. `is_personal=0`. Il creatore è admin; può invitare altri **membri della stessa famiglia** come amministratori. Gli admin gestiscono i regali in Receive come una lista personale. Gli altri membri della famiglia la vedono in Give. Inter-famiglia: l’invito admin è limitato alla famiglia corrente.

## §3 Stack

- SvelteKit 2, TypeScript, Vite, PWA.
- Tailwind CSS + DaisyUI con **tema custom Geeft** (token in `brand/PALETTE.md`): Slate `#5C6B7A` primario, Peach `#E8A87C` accento, Mist `#EDE8E1` superfici, Ink `#1C1917` testo, Paper `#FAF7F2` fondi. **Non** usare il tema `fantasy`. **Non** usare rosso+verde, oro da addobbo o motif natalizi.
- Asset originali in `brand/` (logo, mark, `small.png`, `android.png`).
- Drizzle ORM + `better-sqlite3`.
- SQLite `data/geeft.sqlite` (directory `data/` non versionata); `PRAGMA journal_mode=WAL` e `PRAGMA foreign_keys=ON` per ogni connessione.
- Better Auth email/password, sessioni via cookie httpOnly (Secure in produzione, SameSite appropriato). Reset e cambio password via email transazionale **SMTP2GO** (`SMTP2GO_API_KEY`, mittente `MAIL_FROM`). Senza API key le mail non partono (utile in locale).
- i18n: `it` default, `fr`, `en`.
- `vite-plugin-pwa` per manifest/service worker/icone. Installabilità sì; **non** mettere in cache HTML autenticato.
- TDM: un processo Node, un file SQLite, nessun GraphQL o servizio esterno necessario.
- Mutazioni: primarie SvelteKit `load` + form actions. Eventuali `+server.ts` riusano gli **stessi** helper di visibilità e autorizzazione. Nessun DTO diverso per REST.

## §4 Authorization & visibility matrix

I filtri sono applicati nelle query server-side prima della serializzazione. Un campo non autorizzato non compare in payload, HTML SSR, endpoint, conteggio, tooltip o errore.

In Give il client riceve solo uno stato di prenotazione `none | mine | other`. Mai `reserved_by`, mai first name, mai email.

| Actor/context                          | Lista e idee                                                                  | Identità reserver                              | Stato prenotazione                                                                      | Commenti                   | `hidden_from_recipient=1`              | `received_at` |
| -------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------- | -------------------------------------- | ------------- |
| Destinatario in Receive, propria lista | Titolo, descrizione, URL, `received_at`, mutazioni proprie su idee non secret | **Mai** id/nome                                | **Mai** in UI; può scoprire solo che l’idea non è eliminabile se la delete risponde 409 | **Mai**                    | Record completamente escluso           | Sì, proprio   |
| Destinatario via API diretta           | Solo risorse proprie ammesse                                                  | Mai nel response; errori non rivelano reserver | Nessun dettaglio Give                                                                   | Mai                        | Sempre escluso                         | Sì, proprio   |
| Altro membro in Give, lista altrui     | Idee della famiglia corrente (incluse secret visibili ai giver)               | **Mai**                                        | `none` / `mine` / `other`                                                               | Commenti privati per giver | Visibile ai giver, mai al destinatario | Sì            |
| Reserver in Give                       | Idea prenotata                                                                | Solo che è `mine`, senza esporre l’id          | Può unreserve solo la propria prenotazione, non se `received_at`                        | Commenti secondo policy    | Può vedere la propria sorpresa         | Sì            |
| Non membro della famiglia corrente     | Nessun dato                                                                   | Nessun campo                                   | Nessun campo                                                                            | Nessun campo               | Nessun campo                           | Nessun campo  |
| Log server                             | Minimo necessario                                                             | Non loggare identità/secret inutilmente        | —                                                                                       | Non loggare testo privato  | Non loggare contenuto segreto          | —             |

Badge Give obbligatori (anonimi): me → IT `Hai prenotato questo regalo`, FR `Vous avez réservé ce cadeau`, EN `You reserved this gift`; someone else → IT `Qualcuno ha prenotato questo regalo`, FR `Quelqu'un a réservé ce cadeau`, EN `Someone reserved this gift`. Receive omette il campo sottostante. Tre stati visivi in Give (`none` / `mine` / `other`), stessa altezza card.

## §5 Data model

Usare UUID/text IDs oppure integer IDs in modo coerente. Timestamp in UTC ISO string o integer epoch, con una sola convenzione. Tipi indicati sono Drizzle/SQLite raccomandati.

### `user`

- `id TEXT PRIMARY KEY`
- `email TEXT NOT NULL UNIQUE`
- `first_name TEXT NOT NULL`
- `last_name TEXT NULL`
- `locale TEXT NOT NULL DEFAULT 'it'` (check `it|fr|en`)
- `current_family_id TEXT NULL REFERENCES family(id) ON DELETE SET NULL`
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`

Better Auth gestisce password hash e account; mai password in chiaro. `current_family_id` deve sempre essere una famiglia di cui l’utente è `family_member` (vincolo applicativo, ricontrollato a ogni request).

### Better Auth tables

Creare le tabelle richieste dall’adapter Better Auth, tipicamente `session`, `account`, `verification` (e le colonne esatte della versione installata), con FK a `user`, scadenze e indici su token/email. Cookie httpOnly. Non reinventare l’autenticazione né esporre token nei payload applicativi. Nessun flusso forgot-password in v1.

### `family`

- `id TEXT PRIMARY KEY`
- `name TEXT NOT NULL`
- `invite_code_hash TEXT NOT NULL UNIQUE` (hash del codice; mai serializzare il hash ai client)
- `created_at INTEGER/TEXT NOT NULL`

Il plaintext dell’invite è ad alta entropia. Si mostra **solo agli owner**, e solo alla creazione o rigenerazione. Join: hash del codice inviato, lookup per `invite_code_hash`. Rigenerare invalida il codice precedente. Non loggare il plaintext.

### `family_member`

- `family_id TEXT NOT NULL REFERENCES family(id) ON DELETE CASCADE`
- `user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `role TEXT NOT NULL DEFAULT 'member'` (`owner|member`)
- `joined_at INTEGER/TEXT NOT NULL`
- PK (`family_id`, `user_id`); index su `user_id` e `family_id`.

Chi crea la famiglia è `owner`. Chi entra con invite è `member`.

### `gift_list`

- `id TEXT PRIMARY KEY`
- `family_id TEXT NOT NULL REFERENCES family(id) ON DELETE CASCADE`
- `owner_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `name TEXT NOT NULL`
- `is_personal INTEGER NOT NULL DEFAULT 1` (boolean 0/1)
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`
- UNIQUE parziale (`owner_id`) WHERE `is_personal=1` — **una lista personale per utente**, visibile in tutte le famiglie di cui è membro.
- UNIQUE parziale (`family_id`, `name`) WHERE `is_personal=0` — nome unico tra le liste gestite della famiglia di origine.
- `owner_id` sulla lista gestita è il creatore.
- Visibilità liste gestite: tabella `list_family` (`list_id`, `family_id`). Il creatore sceglie in Impostazioni in quali famiglie compare (es. Alba in Pétisné e Magnarello, lista di coppia solo in una).

Niente colonna `hide_reserved`: la privacy Receive è sempre on, non è un flag.

### `list_admin`

- `list_id TEXT NOT NULL REFERENCES gift_list(id) ON DELETE CASCADE`
- `user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `created_at INTEGER/TEXT NOT NULL`
- PK (`list_id`, `user_id`)

Solo su liste `is_personal=0`. Il creatore è inserito alla creazione. Invito admin: membership nella stessa famiglia. Non si può togliere l’ultimo admin.

### `gift`

- `id TEXT PRIMARY KEY`
- `list_id TEXT NOT NULL REFERENCES gift_list(id) ON DELETE CASCADE`
- `created_by TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `title TEXT NOT NULL`
- `description TEXT NULL`
- `url TEXT NULL` (solo `https:`; mai `javascript:`)
- `reserved_by TEXT NULL REFERENCES user(id) ON DELETE SET NULL`
- `reserved_at INTEGER/TEXT NULL`
- `received_at INTEGER/TEXT NULL`
- `hidden_from_recipient INTEGER NOT NULL DEFAULT 0` (boolean 0/1)
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`
- indexes on `list_id`, `created_by`, `reserved_by`, `hidden_from_recipient`, and (`list_id`, `created_at`, `id`).

Idee create in Receive: `created_by = list.owner_id`. Secret in Give: `created_by =` giver, `hidden_from_recipient=1`, `reserved_by = created_by` e `reserved_at` valorizzati **nella stessa transazione**.

`reserved_by` è nullable. Delete del destinatario consentita solo se NULL; altrimenti transazione 409. `received_at` è stato “già avuto”, non prenotazione: visibile in Give; una idea con `received_at` non nullo non è prenotabile.

Dopo `reserved_by IS NOT NULL`, titolo, descrizione e URL sono **congelati** (PATCH 409). Il destinatario può ancora impostare `received_at` in Receive sulle idee non secret.

### `gift_comment`

- `id TEXT PRIMARY KEY`
- `gift_id TEXT NOT NULL REFERENCES gift(id) ON DELETE CASCADE`
- `author_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE`
- `body TEXT NOT NULL`
- `created_at INTEGER/TEXT NOT NULL`
- `updated_at INTEGER/TEXT NOT NULL`
- index su (`gift_id`, `created_at`) e `author_id`.

I commenti sono coordinamento privato per giver autorizzati; mai joinarli in una query Receive. Niente edit. L’autore può cancellare il proprio commento.

## §6 Behaviors P1 and P2

### P1.1 Reservation badges

In Give, dopo autorizzazione server: `mine` → `Hai prenotato questo regalo` / `Vous avez réservé ce cadeau` / `You reserved this gift`; `other` → `Qualcuno ha prenotato questo regalo` / `Quelqu'un a réservé ce cadeau` / `Someone reserved this gift`. Nessun nome. Receive omette il campo. Payload Give: `{ reservation: "none" | "mine" | "other" }` senza `reserved_by`.

### P1.2 Confirmation

Prima di reserve **e** unreserve mostra una dialog. Testo = catalogo §9 (`gift.reserve.confirm`, `gift.unreserve.confirm`). Pulsanti `action.cancel` e `action.confirm`. Nessuna mutazione prima di Confirm; il server ripete i controlli.

### P1.3 Stable card position

Ogni lista usa `ORDER BY created_at ASC, id ASC`. Render con `{#each gifts as gift (gift.id)}`. Reservation è update ottimistico in-place riconciliato dal server: non riordinare, rimontare, fare fade o cambiare altezza. Usare altezza fissa/minima e skeleton stabile.

### P1.4 Protected delete

Receive delete controlla `reserved_by IS NULL` nella stessa transazione. Se non nullo HTTP 409 e il messaggio `gift.delete.reserved`. Non rivelare chi ha prenotato. La UI non disabilita né nasconde Elimina in base allo stato di prenotazione.

### P1.5 Freeze after reserve

Se `reserved_by IS NOT NULL`, PATCH su `title` / `description` / `url` risponde 409. Non rivelare l’identità del reserver.

### P1.6 Received blocks reserve

`received_at` è visibile in Give. Reserve con `UPDATE … WHERE reserved_by IS NULL AND received_at IS NULL`. Zero righe = 409. Unreserve con `WHERE reserved_by = :me AND received_at IS NULL`; zero righe = 409.

### P2.1 Secret gift

Azione Give-only, lista di un altro membro della famiglia corrente. Imposta `hidden_from_recipient=1` e `created_by = currentUser`. **Non** prenota in automatico: `reserved_by` resta NULL finché un giver non prenota. Ogni query/response Receive lo esclude. Non affidarsi a filtro frontend.

Unreserve è consentito come per le altre idee (solo current reserver, non se received). Il creatore può ritirarlo cancellandolo in Give (`created_by = currentUser` e `hidden_from_recipient=1`). Il destinatario non può vederlo né cancellarlo. Il creatore può segnare il secret come consegnato (`received_at`) in Give.

### P2.2 Long titles

Card title con CSS `line-clamp-2` e altezza fissa; modal/dettaglio mostra titolo e descrizione completi. Un titolo lungo non deve spostare le card vicine.

## §7 Screens

1. **Login**: email, password, selettore lingua, errori accessibili e cookie sessione. Niente link forgot-password.
2. **Signup**: first name, last name opzionale, email, password, locale, **invite code obbligatorio**; membership `member`, lista personale `name = first_name`, `is_personal=1`, `current_family_id` = famiglia dell’invite.
3. **Receive**: lista personale e liste gestite di cui si è admin; chip se più liste; add/edit/delete idea, titolo/descrizione/URL, mark received; niente commenti, reserver, secret o stato prenotazione.
4. **Give**: chip con liste personali altrui e liste gestite non amministrate; badge anonimi; dialog reserve/unreserve; commento; secret (create, ritiro, consegnato). Niente auto-reserve.
5. **Gift modal**: titolo completo, descrizione, URL (`rel="noopener noreferrer"`), campi ammessi; nessun dato non autorizzato in SSR/client state.
6. **Confirm dialogs**: reserve e unreserve, Cancel/Confirm, keyboard accessible, traduzioni esatte §9.
7. **Impostazioni** (icona profilo in alto a destra): lingua it/fr/en, liste gestite (crea, admin di famiglia, elimina), famiglia (switch, invite, join, crea). Logout. `/family` reindirizza a `/settings/family`.
8. **Bottom nav**: solo Receive e Give; target ≥44px; viewport 390px.

Empty state Receive/Give e toast/errore per 409. Focus trap sulle dialog.

## §8 API sketch

Primario: form actions e `load`. Path sotto come contratto semantico (stessi status e visibilità se esiste anche REST). Tutte le route richiedono sessione Better Auth salvo login/signup. Ogni handler verifica sessione, membership nella famiglia corrente, ownership e modo.

| Operation             | Method/path esempio                         | Auth/visibility                                                                                             | Success                                           | Errori                                 |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------- |
| List Receive gifts    | `GET /api/receive/lists/:listId/gifts`      | owner + member famiglia corrente; esclude secret, reserver, comments, stato prenotazione                    | 200 filtered list sorted `created_at ASC, id ASC` | 401, 403, 404                          |
| List Give gifts       | `GET /api/give/lists/:listId/gifts`         | member famiglia corrente, non owner destinatario; `reservation` anonimo; include `received_at` e secret     | 200                                               | 401, 403, 404                          |
| Create own gift       | `POST /api/lists/:listId/gifts`             | admin/owner in Receive; `created_by = actor`                                                                | 201                                               | 401, 403, 404, 422                     |
| Update own gift       | `PATCH /api/gifts/:giftId`                  | admin/owner; freeze se reserved                                                                             | 200                                               | 401, 403, 404, **409 reserved**, 422   |
| Delete own gift       | `DELETE /api/gifts/:giftId`                 | admin/owner; transaction richiede `reserved_by IS NULL`                                                     | 204                                               | 401, 403, 404, **409 reserved**, 422   |
| Mark received         | `POST /api/gifts/:giftId/received`          | admin/owner, idea non secret                                                                                | 200                                               | 401, 403, 404, 422                     |
| Reserve               | `POST /api/gifts/:giftId/reserve`           | giver famiglia corrente; non lista gestita/personale propria; `reserved_by IS NULL AND received_at IS NULL` | 200/201                                           | 401, 403, 404, **409**, 422            |
| Unreserve             | `POST /api/gifts/:giftId/unreserve`         | solo current reserver; `received_at IS NULL`                                                                | 200                                               | 401, 403, 404, **409**, 422            |
| Add secret gift       | `POST /api/give/lists/:listId/secret-gifts` | giver, recipient altro membro famiglia corrente; forza hidden, senza auto-reserve                           | 201                                               | 401, 403, 404, 409, 422                |
| Withdraw secret       | `DELETE /api/give/gifts/:giftId`            | `created_by` + secret                                                                                       | 204                                               | 401, 403, 404                          |
| Mark secret delivered | `POST /api/give/gifts/:giftId/delivered`    | `created_by` / current reserver + secret                                                                    | 200                                               | 401, 403, 404, 409, 422                |
| List comments         | `GET /api/gifts/:giftId/comments`           | giver context autorizzato                                                                                   | 200                                               | 401, 403, 404                          |
| Add comment           | `POST /api/gifts/:giftId/comments`          | giver context autorizzato                                                                                   | 201                                               | 401, 403, 404, 422                     |
| Delete comment        | `DELETE /api/comments/:commentId`           | solo autore                                                                                                 | 204                                               | 401, 403, 404                          |
| Family join           | `POST /api/families/join`                   | authenticated; hash codice; crea lista personale se manca; 409 se già member                                | 201/200                                           | 401, 403, 404 invalid, 409 member, 422 |
| Family create         | `POST /api/families`                        | authenticated; caller owner; genera invite; lista personale; opzionale switch corrente                      | 201                                               | 401, 422                               |
| Switch family         | `POST /api/families/current`                | membership richiesta                                                                                        | 200                                               | 401, 403, 404, 422                     |
| Invite regenerate     | `POST /api/families/:id/invite`             | owner; ritorna plaintext una volta                                                                          | 200                                               | 401, 403, 404                          |

Status: `401` no session; `403` sessione ma vietato; `404` missing o intenzionalmente inaccessible senza leak; `409` conflitto di stato; `422` input invalido. Risposte user-facing localizzate e sempre prive di campi vietati.

Reservation atomica: `UPDATE gift SET reserved_by=?, reserved_at=? WHERE id=? AND reserved_by IS NULL AND received_at IS NULL`; zero righe = 409. Unreserve: `WHERE id=? AND reserved_by=:me AND received_at IS NULL`. Tutte le mutation validano membership, famiglia corrente, gestione lista e modo.

Helper unico di visibilità (es. `toReceiveGift` / `toGiveGift`): Receive non ha `reserved_by`, commenti, secret, né `reservation`; Give ha `reservation` enum e `received_at`, mai identità.

## §9 i18n keys for critical strings

Usare chiavi stabili, non testo hard-coded. Catalogo §9 è la fonte; §6 non duplica varianti. Fallback italiano; traduzioni critiche mancanti falliscono i test.

```text
app.receive = { it: "Ricevi", fr: "Recevoir", en: "Receive" }
app.give = { it: "Regala", fr: "Offrir", en: "Give" }
gift.reserve.confirm = { it: "Vuoi prenotare questo regalo?", fr: "Voulez-vous réserver ce cadeau ?", en: "Do you want to reserve this gift?" }
gift.unreserve.confirm = { it: "Vuoi annullare la prenotazione?", fr: "Voulez-vous annuler la réservation ?", en: "Do you want to cancel the reservation?" }
gift.badge.mine = { it: "Hai prenotato questo regalo", fr: "Vous avez réservé ce cadeau", en: "You reserved this gift" }
gift.badge.other = { it: "Qualcuno ha prenotato questo regalo", fr: "Quelqu'un a réservé ce cadeau", en: "Someone reserved this gift" }
gift.delete.reserved = { it: "Non puoi eliminare questa idea perché qualcuno l'ha già prenotata", fr: "Vous ne pouvez pas supprimer cette idée car quelqu'un l'a déjà réservée", en: "You cannot delete this idea because someone has already reserved it" }
action.cancel = { it: "Annulla", fr: "Annuler", en: "Cancel" }
action.confirm = { it: "Conferma", fr: "Confirmer", en: "Confirm" }
action.reserve = { it: "Prenota", fr: "Réserver", en: "Reserve" }
action.unreserve = { it: "Annulla prenotazione", fr: "Annuler la réservation", en: "Unreserve" }
```

Aggiungere login, signup, validation, received, invite, join, crea/switch famiglia, comments, secret withdraw/delivered e accessibility labels.

## §10 Seed data

Family: name `Pétisné`. Invite plaintext di sviluppo `familia-dev-invite` (solo locale; in DB solo l’hash). Non visibile ai non membri.

Account seed, tutti con password locale `geeft123`:

- `lucile@geeft.local`
- `enrico@geeft.local` (owner di Pétisné)
- `caroline@geeft.local`
- `helene@geeft.local` (Hélène)
- `thomas@geeft.local`
- `isabelle@geeft.local`
- `christian@geeft.local`
- `jeremy@geeft.local` (Jérémy)

Una lista personale per ciascun utente in Pétisné, `name = first_name`, `is_personal=1`. Lista gestita seed **Alba** (`is_personal=0`), admin Enrico e Lucile. Sample gifts: idea libera; idea di Lucile prenotata da Enrico; idea ricevuta; titolo lungo; URL https; commento giver-visible; secret di Enrico per Lucile senza auto-reserve. Password e invite seed sono fixture locali, mai produzione.

## §11 Acceptance checklist

- [ ] SvelteKit 2 TypeScript PWA con Tailwind/DaisyUI tema custom Slate/Peach (non `fantasy`) e asset originali in `brand/`.
- [ ] Nessuna copy o iconografia natalizia.
- [ ] SQLite è `data/geeft.sqlite`, usa WAL e `foreign_keys=ON`; schema/migrations Drizzle riproducibili; `data/` non in git.
- [ ] Better Auth email/password con cookie httpOnly; senza sessione 401; reset/cambio password via SMTP2GO.
- [ ] Signup invite-only: senza codice valido non si entra; crea membership, lista personale unica per famiglia, imposta `current_family_id`.
- [ ] Più famiglie: join, create (caller owner), switch corrente; ogni query è scoped alla famiglia corrente.
- [ ] `it` default e `fr`/`en` per UI ed errori critici; catalogo §9 esatto.
- [ ] Receive: solo proprie idee permesse, ordine `created_at ASC, id ASC`; payload/SSR senza reserver, `reservation`, commenti o secret.
- [ ] Give: solo membri della famiglia corrente; badge anonimi esatti; payload `none|mine|other` senza identità; `received_at` visibile.
- [ ] Destinatario non vede mai identità del reserver; UI Receive identica (niente delete disabilitato); API dirette non bypassano.
- [ ] Reserve richiede conferma, è atomico, blocca se già reserved o received; gara → 409.
- [ ] Unreserve richiede conferma; solo current reserver; vietato se received.
- [ ] Delete di idea prenotata → 409 localizzato senza nominare il reserver; PATCH titolo/URL/descrizione su prenotata → 409.
- [ ] Secret: `hidden_from_recipient=1` senza auto-reserve; Receive non lo include mai; creatore può ritirarlo o segnarlo consegnato.
- [ ] Card keyed per gift id, stabile in-place, altezza fissa/minima, senza fade/remount/reorder su optimistic reserve.
- [ ] Titoli card `line-clamp-2`; modal titolo completo.
- [ ] Login, signup, Receive (chip liste gestite), Give, modal, dialog, impostazioni (lingua, liste gestite, famiglia) e bottom nav Receive/Give a 390px; target ≥44px.
- [ ] Commenti privati dei giver; delete solo autore; niente edit.
- [ ] Seed: Pétisné, otto adulti, lista gestita Alba (admin Enrico+Lucile), sample gifts.
- [ ] Liste gestite: create in settings, più admin della stessa famiglia, Receive per admin, Give per gli altri, nome unico per famiglia.
- [ ] Test: visibility matrix, 401/403/404/409/422, race reserve, freeze, received-blocks-reserve, secret exclusion, managed-list co-admin, i18n, schema, build.
- [ ] Check, lint, test e build passano; i cinque passi privacy in COME_USARE.md passano.

## §12 Decisioni di prodotto (storico)

1. **Identità**: liste famiglia generiche, niente Natale; DaisyUI tema custom Slate/Peach, non `fantasy`.
2. **Badge Give**: solo `none | mine | other`, mai il nome del reserver.
3. **Privacy**: niente flag `hide_reserved`; card Receive identiche; 409 è l’unico oracolo sulla prenotazione.
4. **Dopo prenota**: titolo/URL/descrizione congelati; `received_at` visibile in Give e blocca reserve/unreserve.
5. **Secret**: `created_by` obbligatorio, **senza** auto-reserve; ritiro = delete; unreserve consentito.
6. **Commenti**: delete solo autore, niente edit.
7. **Auth/famiglie**: signup invite-only; più famiglie + `current_family_id`; una lista personale per utente per famiglia.
8. **UI chrome**: Famiglia e lingua in Impostazioni (icona profilo); bottom nav solo Ricevi/Regala.
9. **Pétisné**: otto adulti seed; liste gestite per bambini/liste comuni, con più admin (seed: Alba, Enrico+Lucile).
10. **Liste tra famiglie**: i regali personali sono gli stessi in ogni famiglia; le liste gestite si pubblicano famiglia per famiglia. Receive non mostra il nome della famiglia.
11. **Email**: SMTP2GO per reset password, conferma cambio password e altre transazionali. Signup resta invite-only, senza verifica email obbligatoria.
