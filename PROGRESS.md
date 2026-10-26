# PROGRESS — ehsan.exe

Tick a phase only after `npm run build` passes, its "done when" is self-checked and it is committed as `phase N: <summary>`.

- [x] Phase 0 · Foundation — Next + TS + Tailwind, deps, folders, CLAUDE.md, git, Drizzle schema + first migration in Neon
- [x] Phase 1 · Content model — Zod schema, seed, public site from published version
- [x] Phase 2 · Admin core — auth, sections, content, media, draft → preview → publish, history, export/import
- [x] Phase 3 · Universe — starfield, warp, planets, mini-map, sky themes, smooth scroll + reveals
- [x] Phase 4 · First impression — boot, Big Bang particle name, typewriter, HUD
- [x] Phase 5 · Signature sections — constellation, quests, journey orbit, lab, signal station, footer, custom types
- [ ] Phase 6 · Magic layer — cursor, magnetic buttons, achievements, terminal, Konami, shooting stars, sound
- [ ] Phase 7 · Studio — design, effects, game, SEO, inbox, advanced, account
- [ ] Phase 8 · Optimise + secure — quality tiers, caching, a11y, SEO, security, Lighthouse
- [ ] Phase 9 · Deploy prep — DEPLOY.md, ADMIN_GUIDE.md, production seed, final review

## Notes
- Phase 0: no Neon account yet → local dev uses PGlite behind a Neon-HTTP-compatible shim (`npm run db:local`, scripts/local-db.mjs). Same driver/code path as production; swap DATABASE_URL to Neon later. Admin email: ehsanahmedabid@gmail.com (temporary local password in .env.local).
- Extra deps approved: tsx, bcryptjs, server-only, lighthouse, @electric-sql/pglite (dev).
