# PROGRESS — ehsan.exe

Tick a phase only after `npm run build` passes, its "done when" is self-checked and it is committed as `phase N: <summary>`.

- [x] Phase 0 · Foundation — Next + TS + Tailwind, deps, folders, CLAUDE.md, git, Drizzle schema + first migration in Neon
- [x] Phase 1 · Content model — Zod schema, seed, public site from published version
- [x] Phase 2 · Admin core — auth, sections, content, media, draft → preview → publish, history, export/import
- [x] Phase 3 · Universe — starfield, warp, planets, mini-map, sky themes, smooth scroll + reveals
- [x] Phase 4 · First impression — boot, Big Bang particle name, typewriter, HUD
- [x] Phase 5 · Signature sections — constellation, quests, journey orbit, lab, signal station, footer, custom types
- [x] Phase 6 · Magic layer — cursor, magnetic buttons, achievements, terminal, Konami, shooting stars, sound
- [x] Phase 7 · Studio — design, effects, game, SEO, inbox, advanced, account
- [x] Phase 8 · Optimise + secure — quality tiers, caching, a11y, SEO, security, Lighthouse
- [x] Phase 9 · Deploy prep — DEPLOY.md, ADMIN_GUIDE.md, production seed, final review

## Notes
- Phase 0: no Neon account yet → local dev uses PGlite behind a Neon-HTTP-compatible shim (`npm run db:local`, scripts/local-db.mjs). Same driver/code path as production; swap DATABASE_URL to Neon later. Admin email: ehsanahmedabid@gmail.com (temporary local password in .env.local).
- Extra deps approved: tsx, bcryptjs, server-only, lighthouse, @electric-sql/pglite (dev).
- Phase 8: Lighthouse mobile 89–91 / desktop 97, A11y·BP·SEO 100; budgets met; 0 DB queries per visit. Details: lighthouse/REPORT.md. Simulated mobile LCP ~3.1 s (observed 0.35 s) is the one number above target.
- Phase 9: DEPLOY.md, ADMIN_GUIDE.md, README; `db:migrate:prod` / `db:seed:prod` (read `.env.production.local`); `npm run dev:local`. Branch renamed to `main`. Waiting for Ehsan to create Neon/GitHub/Vercel and push.
- Redesign v3 (2026-10-31, on request): vadimcarazan.com-style block portrait from `assets_input/abid.png` (textured B/W blocks, sparkles, dust, mouse ripple), hand-drawn "Abid" signature, Instrument Serif name, scroll shatter + project flight, glass panels (Work/About/Contact/project), terminal kept. Removed boot, starfield/planets, HUD, achievements, cursor, sound, Sections/Game admin. Schema v2 (`works` replaces quests). Local content re-seeded with `--reset-content`.
- 2026-11-03 fixes: face legible again (tile texture keeps each block's tone, perspective-corrected relief, tone-preserving sparkles, blue counts as bright, side trim, min block ~6 px); quality controller no longer cycles or rebuilds the face (warm-up, failed tier not retried, block count fixed per visit); wheel scrolls inside panels/terminal (Lenis prevent); phone address bar no longer makes the camera jump (svh-based screen height, 100lvh canvas); scene sleeps behind an open panel. Added `shaders` (approved by Ehsan) for a WebGPU end-screen glow, desktop only, telemetry off. Domain live: ehsanabid.is-a.dev.
