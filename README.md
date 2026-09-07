# Geeft rebuild

Documentazione di progetto per ricostruire Geeft da zero con Grok Build. Geeft è una lista regali familiare dove **la privacy è il prodotto**: chi riceve non deve mai sapere chi ha prenotato un regalo.

## Documenti

| File | Scopo |
|---|---|
| `SPEC.md` | Specifica completa: prodotto, autorizzazioni, schema SQLite, API e criteri di accettazione. |
| `AGENTS.md` | Regole non negoziabili per l’agente di build. |
| `GROK_BUILD_PROMPT.md` | Prompt inglese pronto da incollare in Grok Build. |
| `COME_USARE.md` | Procedura italiana per brand, CLI, build e test privacy. |
| `brand/README.md` | Asset del brand richiesti. |

## Stack bloccato

SvelteKit 2 + TypeScript PWA, Tailwind CSS + DaisyUI tema `fantasy`, Drizzle ORM + `better-sqlite3`, SQLite in `data/geeft.sqlite` con WAL e foreign keys, Better Auth email/password con cookie httpOnly, i18n `it` (default), `fr`, `en`, `vite-plugin-pwa`.

## Prodotto in una riga

**Ricevi le tue idee senza vedere prenotazioni; regala agli altri prenotando in segreto, senza mai rivelare il prenotatore al destinatario.**
