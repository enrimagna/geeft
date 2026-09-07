# Grok Build prompt — Geeft rebuild

You are rebuilding Geeft from scratch. Before writing code, read SPEC.md and AGENTS.md. They are the source of truth. Do not port the old SvelteKit + Django + GraphQL application. Implement the smallest complete product that passes every item in SPEC.md §11.

## Product

Geeft is a family Christmas gift-list app. In Receive, a person manages own ideas and must never see who reserved them. In Give, a person browses other family lists, reserves gifts, writes private comments, and can create secret gifts. Privacy is the product: if a recipient can learn the reserver, the app is wrong.

## Locked stack and TDM

- SvelteKit 2 + TypeScript PWA.
- Tailwind CSS + DaisyUI theme fantasy.
- Drizzle ORM + better-sqlite3; SQLite file data/geeft.sqlite.
- Enable WAL and PRAGMA foreign_keys=ON on every connection.
- Better Auth email/password with httpOnly cookies; secure in production.
- i18n locales it (default), fr and en.
- vite-plugin-pwa and supplied assets in brand/.
- One Node process, one SQLite file, no GraphQL, Django or required external service.

## Non-negotiable implementation

1. Enforce every authorization and visibility rule server-side in SvelteKit loads, form actions and +server handlers.
2. Receive queries omit reserved_by, reserver identity, comments and all hidden_from_recipient=1 gifts. Never send them or infer them through counts/errors.
3. Give shows other family members’ non-secret ideas and permitted reservation state. Other givers may see first name of reserver; recipient never does.
4. Reserve and unreserve both require confirmation dialogs with exact translations in SPEC §9, Cancel and Confirm actions.
5. Delete of reserved idea returns HTTP 409 with localized protection message; disabling a button is not enough.
6. Secret gifts from Give force hidden_from_recipient=1 and never occur in Receive payloads.
7. Sort created_at ASC, id ASC; render {#each gifts as gift (gift.id)}; optimistic in-place update; fixed/min-height; no fade/remount/reorder.
8. Card title uses line-clamp-2; modal shows full title.
9. Design first for 390px, bottom nav and touch targets at least 44px.
10. Use transactions and conditional guards so two users cannot reserve one gift. Validate family membership and ownership for every mutation.

## Required flows

Implement tables and relations in SPEC §5, Better Auth tables as required by its adapter, seed Familia and the three accounts in §10, and screens in §7: login, signup, Receive, Give, gift modal, confirmation dialogs and family invite. Signup creates a personal list named after first_name with is_personal=true and hide_reserved=true; family membership uses invite code.

Implement the API/form actions in SPEC §8 with explicit 401 unauthenticated, 403 unauthorized, 404 missing/inaccessible, 409 conflict and 422 validation statuses. Do not leak forbidden resource existence. Use exact critical translations from §9.

## Brand and verification

Use original brand/logo.svg, logo.png, small.png and android.png; configure PWA manifest/icons. Add tests for visibility, recipient privacy, confirmation flow, atomic reservation, 409 delete, secret exclusion, stable keying, i18n and auth guards. Run check, lint, tests and build, then verify at 390px.

## Definition of done

Do not stop at a scaffold. Every SPEC §11 criterion must pass, including the five-step privacy scenario: Lucile cannot see Enrico’s identity, comments or secret gift in Receive; another giver sees only permitted reservation data; direct unauthorized API calls fail server-side; reserved ideas cannot be deleted. Report unmet criteria instead of weakening them.
