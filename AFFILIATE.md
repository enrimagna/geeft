# AFFILIATE.md — monetizzazione silenziosa Geeft

> Obiettivo: commissioni su link negozio senza cambiare UX di Receive/Give e senza rompere la privacy.

Enrico ha scelto l’affiliate silenzioso (non stagione, non Family Plus). Mick implementa questo doc.

## §1 Product rules

1. Ogni click su un URL negozio di un gift passa da un redirect Geeft, non apre l’URL grezzo dal client.
2. Nessun banner “compra con noi”, nessun confronto prezzi, nessun ranking che preferisca Amazon in UI.
3. Se l’URL non matcha una regola attiva, redirect all’URL originale invariato.
4. Feature flag globale `affiliate_enabled` (default off finché Enrico non ha i tag Associates).
5. Privacy: non loggare in chiaro dati che collegano destinatario ↔ chi ha cliccato oltre il minimo tecnico. Niente `reserved_by` nei log redirect.
6. Disclaimer i18n in Settings + footer (vedi §7).

## §2 User flow

1. Utente in Give o Receive apre “negozio” / link URL del gift.
2. Client naviga a `GET /r/{giftId}` (stessa origin, cookie sessione ok).
3. Server:
   - autentica (solo membri famiglia della lista del gift; altrimenti 404, non leak);
   - carica `gift.url`;
   - se flag off o url vuoto → 302 a url originale (o 404 se manca);
   - applica `rewriteAffiliateUrl(url, locale)`;
   - scrive riga `affiliate_click` (minimo);
   - 302 Location = url riscritta.
4. Utente atterra sul merchant.

## §3 Data model

### `affiliate_network`

| Campo | Tipo | Note |
|---|---|---|
| `id` | TEXT PK | uuid |
| `key` | TEXT UNIQUE | es. `amazon_it`, `amazon_fr`, `amazon_de`, `amazon_uk` |
| `name` | TEXT | label admin |
| `enabled` | INTEGER 0/1 | |
| `priority` | INTEGER | match order, più basso = prima |
| `host_patterns` | TEXT | JSON array di host/suffix, es. `["amazon.it","www.amazon.it","amzn.eu"]` |
| `tag_param` | TEXT | es. `tag` per Amazon |
| `tag_value` | TEXT | es. `geeft-21` — **segreto operativo, solo admin** |
| `extra_params` | TEXT NULL | JSON object opzionale da merge-are nella query |
| `notes` | TEXT NULL | |
| `created_at` / `updated_at` | | |

### `affiliate_click`

| Campo | Tipo | Note |
|---|---|---|
| `id` | TEXT PK | |
| `gift_id` | TEXT FK gift | |
| `user_id` | TEXT FK user NULL | chi ha cliccato; ok se loggato |
| `network_id` | TEXT FK NULL | null se passthrough |
| `original_host` | TEXT | |
| `rewritten` | INTEGER 0/1 | |
| `created_at` | | |
| `ua_hash` | TEXT NULL | hash UA, non UA intero |

Index su `(created_at)`, `(network_id, created_at)`, `gift_id`.

Niente body HTML del merchant, niente query string completa nei log (può contenere dati sensibili).

### Feature flag

`app_settings` key `affiliate_enabled` = `0|1`, o colonna in settings esistenti. Solo admin la cambia.

## §4 `rewriteAffiliateUrl(url, locale)`

1. Parse URL; se invalida → return original.
2. Normalizza host lowercase, strip porta.
3. Carica networks `enabled=1` ordered by `priority ASC`.
4. Match se host == pattern o host endsWith `.`+pattern (gestisci `amazon.it` vs `www.amazon.it` vs `smile.amazon.it` se serve).
5. Prima match vince.
6. Set/replace query param `tag_param=tag_value`; merge `extra_params` senza cancellare path/asin.
7. Non riscrivere deep link non-http(s).
8. Unit test obbligatori: non-Amazon intatto; Amazon con tag; flag off → intatto; gift senza url.

**v1 networks da seed (disabilitati finché tag non inseriti in admin):**

- `amazon_it` — hosts amazon.it, www.amazon.it, amzn.eu (path IT se distinguibile)
- `amazon_fr`, `amazon_de`, `amazon_co_uk` — analoghi

Locale utente può scegliere quale store preferire solo se l’URL è già di quello store; **non** convertire un link `.com` in `.it` in v1 (rompe il prodotto).

## §5 API / routes

### Pubblico autenticato

- `GET /r/[giftId]` — §2. Risposte: 302 | 401 | 404. Mai 403 che rivela esistenza a non-membri → usa 404.

### Admin (solo ruolo `admin` o allowlist user id in env `GEEFT_ADMIN_IDS`)

- `GET /admin/affiliate` — UI lista network + toggle flag globale + conteggi click 7/30 giorni.
- `POST /admin/affiliate/networks` — create
- `PATCH /admin/affiliate/networks/[id]` — update (tag, patterns, enabled, priority)
- `DELETE /admin/affiliate/networks/[id]` — soft o hard; preferisci disable
- `POST /admin/affiliate/settings` — `{ affiliate_enabled: boolean }`

AuthZ: se non admin → 404 sulla sezione admin (non pubblicizzare l’esistenza).

## §6 Admin UI (richiesta esplicita di Enrico)

Pagina unica, desktop-ok, niente marketing.

**Sezione A — Flag**

- Toggle “Affiliate attivo”
- Testo aiuto: se off, `/r/*` fa solo passthrough

**Sezione B — Networks**

Tabella: name, key, hosts (chip), tag mascherato (`gee***`), enabled, priority, click 7g.

Azioni: Aggiungi / Modifica / Disabilita.

Form campi:

- Nome visuale
- Key (immutable dopo create)
- Host patterns (textarea, un host per riga)
- Tag param (default `tag`)
- Tag value (password-style input, show/hide)
- Extra params JSON opzionale
- Priority (number)
- Enabled

**Sezione C — Attività**

Ultime 50 click: data, gift id corto, host, rewritten sì/no, network. Niente PII oltre user id interno se serve debug.

Validazione: host non vuoti; tag value obbligatorio se enabled; JSON extra valido.

## §7 i18n disclaimer (chiavi)

IT: `Alcuni link ai negozi possono generare una commissione per Geeft, senza costo aggiuntivo per te.`
FR: `Certains liens marchands peuvent générer une commission pour Geeft, sans frais supplémentaires pour toi.`
EN: `Some shop links may earn Geeft a commission, at no extra cost to you.`

Mostra in Settings (sempre) e footer app. Non nel modal regalo (rumore).

## §8 Sicurezza

- Tag value solo DB + admin; mai nel client bundle.
- Rate limit `/r/*` per user (es. 60/min).
- Open-redirect: Location solo da `gift.url` in DB dopo rewrite, mai da query `?url=`.
- CSRF sulle mutazioni admin (form actions SvelteKit ok).

## §9 Done when

- [ ] Flag off: link escono invariati via `/r/{id}`
- [ ] Flag on + Amazon IT rule: tag presente sulla Location
- [ ] URL non match: passthrough
- [ ] Non-membro famiglia: 404 su `/r/{id}`
- [ ] Admin: CRUD network + toggle flag
- [ ] Tag non compare in HTML/JS client
- [ ] Disclaimer IT/FR/EN in settings/footer
- [ ] Test unit su `rewriteAffiliateUrl`
- [ ] README snippet: come inserire il primo tag Amazon

## §10 Fuori scope v1

Conversion tracking post-purchase, multi-rete generiche (Awin day-one), riscrittura store per locale, UI che spinge Amazon, payout dashboard oltre conteggi click.
