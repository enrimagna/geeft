# Come usare questo pack

## 1. Asset del brand

File originali da copiare in brand: logo.svg, logo.png, small.png, android.png.

## 2. Build

Incolla GROK_BUILD_PROMPT.md in Grok Build dopo aver verificato SPEC.md e AGENTS.md.

## 3. Post-build

Esegui installazione dipendenze, check, lint, test, build e preview dalla root.

## 4. Mobile

Verifica viewport 390px, target touch 44px, bottom navigation, italiano/francese/inglese, card stabile e titolo completo nel modal.

## 5. Test privacy in 5 passi

1. Lucile in Receive vede solo le proprie idee e nessun reserver, commento o regalo segreto.
2. Enrico in Give prenota un’idea di Lucile e aggiunge commento e regalo segreto.
3. Lucile non vede identità, commento o sorpresa; la sorpresa non è nel payload.
4. Caroline in Give vede solo lo stato consentito; in Receive non vede mai il reserver; unreserve chiede conferma.
5. Delete di idea prenotata, anche via API, risponde 409 con messaggio localizzato.

## Comandi post-build

Dalla root dell’app esegui il package manager con gli script `install`, `check`, `lint`, `test`, `build` e `preview` definiti in package.json. Poi crea data/ e avvia lo script di seed se presente.

Per sviluppo usa lo script dev e apri l’URL locale in viewport mobile 390px. Gli account seed sono in SPEC.md; in ambiente reale cambia subito le password.
