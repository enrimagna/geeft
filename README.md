# Geeft

Liste regalo in famiglia. **La privacy è il prodotto**: chi riceve non deve mai sapere chi ha prenotato un regalo.

Uso generico (compleanni, nascite, matrimoni). Non è un’app di Natale.

**Ricevi** le tue idee e le liste che amministri, senza vedere prenotazioni. **Regala** alle altre liste della famiglia corrente: prenoti in segreto, con badge anonimi (`Hai prenotato` / `Qualcuno ha prenotato`).

## Avvio

Copia `.env.example` in `.env` e imposta `BETTER_AUTH_SECRET` (almeno 32 caratteri casuali).

```sh
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Apri http://127.0.0.1:5173 — viewport mobile ~390px.

```sh
npm run check
npm run lint
npm test
npm run build
```

## Account seed

Famiglia **Pétisné**. Password per tutti: `geeft123`. Invite locale: `familia-dev-invite`.

| Nome      | Email                 |
| --------- | --------------------- |
| Lucile    | lucile@geeft.local    |
| Enrico    | enrico@geeft.local    |
| Caroline  | caroline@geeft.local  |
| Hélène    | helene@geeft.local    |
| Thomas    | thomas@geeft.local    |
| Isabelle  | isabelle@geeft.local  |
| Christian | christian@geeft.local |
| Jérémy    | jeremy@geeft.local    |

Lista gestita **Alba** (admin Enrico e Lucile). In Impostazioni → Liste gestite puoi spuntare in quali famiglie compare (es. anche Magnarello). I regali personali sono gli stessi in ogni famiglia.

## Cosa c’è

- **Ricevi / Regala** — bottom nav. Ricevi non mostra il nome della famiglia.
- **Impostazioni** (iniziale in alto a destra) — lingua it/fr/en, liste gestite, famiglia, logout.
- **Liste gestite** — bambini, liste comuni, chi non ha un account. Più amministratori della stessa famiglia. Visibilità per famiglia, a scelta.
- Prenotazione atomica, freeze dopo prenota, secret senza auto-reserve, commenti privati dei giver.

## Stack

SvelteKit 2, Tailwind CSS + DaisyUI tema custom Slate/Peach, Drizzle + better-sqlite3 (`data/geeft.sqlite`, WAL + foreign keys), Better Auth email/password, i18n it/fr/en, PWA.

## Documenti

| File                   | Scopo                                       |
| ---------------------- | ------------------------------------------- |
| `SPEC.md`              | Contratto: privacy, schema, API, checklist. |
| `AGENTS.md`            | Regole non negoziabili.                     |
| `COME_USARE.md`        | Seed, brand, test privacy in 5 passi.       |
| `GROK_BUILD_PROMPT.md` | Prompt di rebuild.                          |
| `AFFILIATE.md`         | Monetizzazione silenziosa / redirect.       |
| `brand/`               | Logo, mark, icone PWA, palette.             |

## Affiliate (Amazon)

Silent shop redirects via `GET /r/{giftId}`. Feature flag defaults **off**.

1. Set `GEEFT_ADMIN_IDS` in `.env` to your Better Auth user id(s), comma-separated.
2. `npm run db:migrate` then `npm run db:seed` (seeds `amazon_it` / `fr` / `de` / `co_uk` disabled).
3. Open `/admin/affiliate`, paste your Amazon Associates tag (e.g. `geeft-21`) on the matching network, enable that network.
4. Toggle **Affiliate attivo**.

Tags never leave the server (admin UI only). Non-matching URLs pass through unchanged. Do not rewrite `.com` links to `.it`.

