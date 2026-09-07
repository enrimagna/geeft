# AGENTS.md — regole non negoziabili

## Missione

Ricostruisci Geeft da zero. Non portare il vecchio codice SvelteKit + Django + GraphQL: usa SPEC.md come contratto e privilegia semplicità, verificabilità e privacy.

## Regole dure

1. Privacy server-side sempre: ogni load, form action, endpoint e query verifica sessione, appartenenza alla famiglia, ownership e modo. La UI non è un confine di sicurezza.
2. Receive è cieco: il payload non include mai reserved_by, nome del reserver, commenti o regali con hidden_from_recipient=1; il destinatario non deve poter inferire l’identità.
3. Give consente a un membro di vedere liste altrui, prenotare, annullare la propria prenotazione, aggiungere commenti privati e creare regali segreti; non modificare o cancellare idee altrui.
4. Reserve e unreserve richiedono conferma UI e ricontrollo server-side; la prenotazione deve essere atomica e impedire race/doppioni.
5. Delete con reserved_by non nullo risponde HTTP 409 con il messaggio localizzato: Non puoi eliminare questa idea perché qualcuno l’ha già prenotata.
6. Un regalo segreto imposta hidden_from_recipient=1 ed è escluso server-side da ogni query e payload Receive.
7. Ordine fisso created_at ASC, id ASC; usare {#each gifts as gift (gift.id)}, update ottimistico in-place, altezza fissa/minima e nessun fade/remount.
8. Titolo card con line-clamp-2, titolo completo nel modal, altezza card stabile.
9. Stack bloccato: SvelteKit 2, TypeScript, Tailwind, DaisyUI fantasy, Drizzle + better-sqlite3, SQLite WAL + foreign keys, Better Auth email/password con cookie httpOnly, i18n it/fr/en, vite-plugin-pwa.
10. TDM: un processo Node, un file data/geeft.sqlite, niente GraphQL, Django, microservizi, coda o database cloud.
11. Mobile first 390px, target touch almeno 44px, bottom navigation.
12. Non loggare password, cookie, token o testo privato; secure cookie in produzione.

## Don’t

Non rivelare il reserver al destinatario in UI, SSR, API, conteggi, tooltip o errori. Non usare CSS/hidden come autorizzazione. Non permettere delete di regalo prenotato. Non aggiungere feature estranee prima del core. Non sostituire asset originali o lingua default.

## Done

Il lavoro è done solo quando tutti i criteri numerati in SPEC.md §11 passano: test diretti 401/403/404/409/422, isolamento Receive/Give, i18n, schema/migrazioni, seed Familia, PWA, mobile e cinque passi privacy. Se un criterio privacy è incerto, non è done.
