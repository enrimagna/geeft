## Project Configuration

- **Language**: TypeScript
- **Package Manager**: npm
- **Add-ons**: prettier, eslint, vitest, tailwindcss, sveltekit-adapter, drizzle, better-auth, paraglide

---

# AGENTS.md — regole non negoziabili

## Missione

Ricostruisci Geeft da zero. Non portare il vecchio codice SvelteKit + Django + GraphQL: usa SPEC.md come contratto e privilegia semplicità, verificabilità e privacy.

## Regole dure

1. Privacy server-side sempre: ogni load, form action, endpoint e query verifica sessione, appartenenza alla **famiglia corrente**, ownership e modo. La UI non è un confine di sicurezza. Helper unico di visibilità per Receive e Give.
2. Receive è cieco: il payload non include mai `reserved_by`, nome del reserver, `reservation`, commenti o regali con `hidden_from_recipient=1`. Card identiche: non disabilitare Elimina, non cambiare copy in base alla prenotazione. Il destinatario può inferire solo da un 409 sulla delete.
3. Give consente a un membro di vedere liste altrui della famiglia corrente, prenotare, annullare la propria prenotazione (non secret, non received), commenti privati e secret gift. Badge **anonimi** `mine` / `other`: mai first name o id del reserver. Non modificare idee altrui.
4. Reserve e unreserve richiedono conferma UI e ricontrollo server-side; prenotazione atomica (`reserved_by IS NULL AND received_at IS NULL`). `received_at` è visibile in Give e blocca reserve/unreserve.
5. Delete con `reserved_by` non nullo → HTTP 409 con `gift.delete.reserved`. PATCH titolo/descrizione/URL su idea prenotata → 409.
6. Secret gift: `hidden_from_recipient=1` e `created_by` = giver, **senza** auto-reserve. Escluso da ogni query Receive. Il creatore può ritirarlo o segnarlo consegnato; prenotazione/unreserve come le altre idee.
7. Ordine fisso `created_at ASC, id ASC`; `{#each gifts as gift (gift.id)}`; update ottimistico in-place; altezza fissa/minima; nessun fade/remount.
8. Titolo card `line-clamp-2`, titolo completo nel modal, altezza card stabile.
9. Stack bloccato: SvelteKit 2, TypeScript, Tailwind, DaisyUI **tema custom Slate/Peach** (non `fantasy`), Drizzle + better-sqlite3, SQLite WAL + foreign keys, Better Auth email/password cookie httpOnly, i18n it/fr/en, vite-plugin-pwa. Niente SMTP/reset password in v1. Form actions + load come primario.
10. TDM: un processo Node, un file `data/geeft.sqlite`, niente GraphQL, Django, microservizi, coda o database cloud. Signup **invite-only**; più famiglie con `current_family_id`; una lista personale per utente (visibile in tutte le sue famiglie) **più** liste gestite pubblicate famiglia per famiglia, con più admin. Niente colonna `hide_reserved`.
11. Mobile first 390px, target touch almeno 44px, bottom navigation.
12. Non loggare password, cookie, token, invite plaintext o testo privato; secure cookie in produzione. Niente copy o iconografia natalizia. Asset originali in `brand/`.

## Don’t

Non rivelare il reserver al destinatario in UI, SSR, API, conteggi, tooltip o errori. Non usare CSS/hidden come autorizzazione. Non disabilitare Elimina per segnalare una prenotazione. Non permettere delete o edit di contenuto prenotato. Non mostrare first name in Give. Non aggiungere feature estranee prima del core. Non sostituire asset originali o lingua default. Non usare DaisyUI `fantasy`.

## Done

Il lavoro è done solo quando tutti i criteri numerati in SPEC.md §11 passano: test diretti 401/403/404/409/422, isolamento Receive/Give, badge anonimi, freeze, secret auto-reserve, famiglie multiple, i18n, schema/migrazioni, seed Pétisné, PWA, mobile e cinque passi privacy. Se un criterio privacy è incerto, non è done.
