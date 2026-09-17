# Come usare `/admin/affiliate`

Pagina solo per gli id in `GEEFT_ADMIN_IDS`. Chi non è in lista vede **404** (la sezione non viene pubblicizzata).

La feature è nella PR https://github.com/enrimagna/geeft/pull/1 — dopo merge + deploy su productie.

## 1. Metterti in allowlist

1. Accedi a Geeft con l’account admin (es. Enrico).
2. Recupera il tuo **user id** Better Auth (tabella `user`, colonna `id`), ad esempio:
   ```bash
   sqlite3 data/geeft.sqlite "SELECT id, email FROM user;"
   ```
3. Nel `.env` del server (o Compose):
   ```env
   GEEFT_ADMIN_IDS=il-tuo-user-id
   ```
   Più admin: `id1,id2` (virgola, senza spazi inutili).
4. Riavvia il processo Node così legge l’env.

## 2. Migrate + seed (una volta)

Sul server / in locale, dalla root dell’app:

```bash
npm run db:migrate
npm run db:seed
```

Il seed crea:

- flag `affiliate_enabled = 0` (off)
- reti `amazon_it`, `amazon_fr`, `amazon_de`, `amazon_co_uk` **disabilitate**, tag vuoti

## 3. Aprire la pagina

URL: **`/admin/affiliate`** (es. `https://geeft.app/admin/affiliate` dopo deploy).

Devi essere loggato **e** il tuo id deve essere in `GEEFT_ADMIN_IDS`. Altrimenti 404.

## 4. Configurare Amazon

Ordine consigliato:

1. Nella tabella **Networks**, apri **Modifica** su `amazon_it` (o la rete del tuo Associates).
2. Incolla il **tag** Associates (es. `geeft-21`) nel campo tag (show/hide).
3. Controlla gli host (uno per riga: `amazon.it`, `www.amazon.it`, …).
4. Spunta **Enabled** e salva.
5. Ripeti per FR/DE/UK se hai i tag.
6. Nella sezione **Flag**, premi **Attiva** → «Affiliate attivo».

Finché il flag è off, `/r/{giftId}` fa solo **passthrough** (URL originale, niente tag).

## 5. Cosa fa la pagina

| Sezione | Uso |
|--------|-----|
| **Flag** | Accende/spegne il rewrite globale; mostra click 7g / 30g |
| **Networks** | CRUD reti (host, tag, priority, enabled). Tag mascherato in lista |
| **Attività** | Ultime 50 click: data, gift corto, host, rewritten sì/no |

## 6. Come si usa dal resto dell’app

- In Give/Receive i link negozio vanno a `GET /r/{giftId}` (stessa origine, cookie ok).
- Se sei membro della famiglia del gift: 302 verso URL (riscritta o originale).
- Se non sei membro: **404**.
- Disclaimer i18n in Impostazioni + footer.

## 7. Controlli rapidi

- Flag off → Location = URL grezzo del gift.
- Flag on + rete Amazon IT enabled con tag → Location contiene `tag=…`.
- URL non Amazon → passthrough.
- Tag **mai** nel HTML/JS pubblico (solo admin).

## Sicurezza

- Non mettere `GEEFT_ADMIN_IDS` o i tag nel client / repo pubblici.
- Non abilitare una rete senza tag: la UI richiede il tag se enabled.
- Niente open-redirect da query `?url=`: la Location esce solo da `gift.url` in DB.
