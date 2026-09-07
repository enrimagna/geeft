# Grok Build prompt — Geeft rebuild

You are rebuilding Geeft from scratch. Before writing code, read SPEC.md and AGENTS.md. They are the source of truth. Do not port the old SvelteKit + Django + GraphQL application. Implement the smallest complete product that passes every item in SPEC.md §11.

## Product

Geeft is a family gift-list app (birthdays, births, weddings, household lists — not a Christmas app). In Receive, a person manages own ideas and must never see who reserved them. In Give, a person browses other family lists, reserves gifts, writes private comments, and can create secret gifts. Privacy is the product: if a recipient can learn the reserver, the app is wrong.

Signup is invite-only. A user may belong to multiple families; all queries are scoped to `current_family_id`. One personal list per user per family, plus managed lists (`is_personal=0`) with multiple same-family admins (children, shared lists). Admins manage them in Receive; other members see them in Give.

## Locked stack and TDM

- SvelteKit 2 + TypeScript PWA.
- Tailwind CSS + DaisyUI **custom Geeft theme** from brand/PALETTE.md (Slate `#5C6B7A`, Peach `#E8A87C`, Mist, Ink, Paper). Do **not** use DaisyUI `fantasy`. No Christmas palette or copy.
- Drizzle ORM + better-sqlite3; SQLite file data/geeft.sqlite (git-ignore `data/`).
- Enable WAL and PRAGMA foreign_keys=ON on every connection.
- Better Auth email/password with httpOnly cookies; secure in production. No email password-reset in v1.
- i18n locales it (default), fr and en. Critical strings from SPEC §9 are exact.
- vite-plugin-pwa and supplied assets in brand/. Do not cache authenticated HTML.
- Primary surface: SvelteKit load + form actions sharing one visibility helper. Optional +server.ts must use the same helpers.
- One Node process, one SQLite file, no GraphQL, Django or required external service.

## Non-negotiable implementation

1. Enforce every authorization and visibility rule server-side in loads, form actions and handlers, scoped to the current family.
2. Receive queries omit reserved_by, reserver identity, reservation status, comments and all hidden_from_recipient=1 gifts. Receive cards look identical whether reserved or not; do not disable Delete.
3. Give shows other members’ lists in the current family. Payload reservation is only `none | mine | other`. Never send first name or reserved_by. received_at is visible in Give.
4. Reserve and unreserve both require confirmation dialogs with exact SPEC §9 copy. Atomic UPDATE … WHERE reserved_by IS NULL AND received_at IS NULL.
5. Delete of reserved idea returns HTTP 409 with gift.delete.reserved. PATCH of title/description/url on a reserved idea returns 409.
6. Secret gifts force hidden_from_recipient=1 without auto-reserve. They never occur in Receive. Creator may withdraw or mark delivered; reserve/unreserve work like other gifts.
7. Sort created_at ASC, id ASC; render {#each gifts as gift (gift.id)}; optimistic in-place update; fixed/min-height; no fade/remount/reorder.
8. Card title uses line-clamp-2; modal shows full title.
9. Design first for 390px, bottom nav and touch targets at least 44px.
10. Validate family membership, current family, ownership and mode for every mutation. Invite codes are high-entropy; store only invite_code_hash; plaintext returned to owners on create/regenerate only.

## Required flows

Implement tables in SPEC §5 (including user.current_family_id, gift.created_by, family.invite_code_hash; no hide_reserved; UNIQUE family_id+owner_id on gift_list). Seed Familia and the three accounts in §10. Screens in §7: login, signup (invite required), Receive, Give, gift modal, confirmation dialogs, family/profile (list, switch, join, create, owner invite). Signup creates a personal list named after first_name with is_personal=true and sets current_family_id.

Implement the operations in SPEC §8 with 401 unauthenticated, 403 unauthorized, 404 missing/inaccessible, 409 conflict and 422 validation. Do not leak forbidden resource existence. Use exact critical translations from §9.

## Brand and verification

Use original brand assets: logo.svg, logo.png, mark.svg, mark.png, small.png, android.png and android-source.svg; configure PWA manifest/icons. Follow brand/IDENTITY.md and brand/PALETTE.md. Add tests for visibility, recipient privacy, anonymous badges, confirmation, atomic reservation, received-blocks-reserve, freeze-after-reserve, 409 delete, secret auto-reserve and exclusion, current-family scoping, i18n and auth guards. Run check, lint, tests and build, then verify at 390px.

## Definition of done

Do not stop at a scaffold. Every SPEC §11 criterion must pass, including the five-step privacy scenario: Lucile cannot see Enrico’s identity, comments or secret gift in Receive; another giver sees only anonymous reservation state; direct unauthorized API calls fail server-side; reserved ideas cannot be deleted or edited. Report unmet criteria instead of weakening them.
