@AGENTS.md

# ehsan.exe — The Level-Up Universe (condensed spec v2.0)

Personal portfolio + admin panel ("Mission Control") for **Ehsan Ahmed Abid**, BSc CSE, East West University.
Full spec: `ehsan-exe-website-plan.pdf`. This file is the working summary; when in doubt, the PDF wins.
Resume after a stop: read this file + `PROGRESS.md`, check `git status` / `git log`, continue from the first unticked phase.

## Golden rules
- The site must stay useful before the magic works: name, role and LinkedIn readable within 3 s on a slow phone. Every effect is layered **on top of** a fast, readable base — never in front of it.
- **Code** (components, animations, admin) lives in git → Vercel. **Content + design** (texts, projects, colours, images, effects…) lives in Neon and is changed in `/admin` → Publish → live in seconds, no push.
- The **Zod site schema (`src/schema/site.ts`) is the single source of truth.** Every value the public site uses comes from the published `site_versions` row and is editable in admin. Never hardcode content in components.
- Missing personal info → `TODO_EHSAN` placeholder; the admin dashboard lists every TODO field (missing-content checklist).
- Personality: playful but professional (jokes in micro-copy/Easter eggs only); honest (no fake skill %, skills are Mastered / Learning / Locked); one hero effect per screen.
- Free tools only, exactly as listed below. No paid services.
- Mobile first; `prefers-reduced-motion` respected; site readable without WebGL/JS.
- Secrets only in `.env.local` (gitignored) and Vercel env vars; `.env.example` is committed.
- Ehsan is a CSE student: short comments explaining tricky parts (shaders, particle physics, FPS controller, auth, caching).
- After EVERY phase: `npm run build`, fix all errors + type warnings, self-check the phase's "done when", commit `phase N: <summary>`, tick PROGRESS.md.
- Stop and ask only for: Neon dev connection string, admin email + first password (before seeding), any dependency not listed in the spec, final approval before pushing (Ehsan pushes himself).
- Chat: one short line per finished phase.

## Design v3 (current — replaces the original "Level-Up Universe" scenes)
Ehsan asked (2026-10-31) for a redesign modelled on vadimcarazan.com. Built as our own implementation (no copied code/assets):
- **Hero**: Ehsan's portrait rebuilt from thousands of small **textured blocks** (WebGL instancing, `src/components/world/`). Mostly black & white (tone from the photo, contrast-curved; bright = bigger + closer, shadows sparse), a few vivid "sparkle" blocks, faint background dust. Every block shows a tile from a texture atlas (`atlas.ts`): procedural mini-thumbnails + Ehsan's project images once he adds them. The real photo is never shown — only the blocks (and a pixelated B/W version in the OG image).
- Mouse ripple pushes/brightens blocks; camera leans toward the mouse.
- **Signature**: "Abid" written by hand across the background (`Signature.tsx`, stroke-dashoffset loop). Admin can paste a real signature SVG path.
- Small Inter Tight top bar: logo (initials or uploaded) · Currently · Based in (live Dhaka time) · Navigation (Work, About, Contact). Huge italic Instrument Serif name at the bottom, letters rise in. Intro paragraph + "Explore the work" pill.
- **Scroll** = the face shatters into a 3D field and the camera flies through it; **only real projects** (Admin → Content → Projects) fly in as cards (image or typographic title card), with a counter "003 · Title · 3 of N works". No projects → end screen "New work is on its way."
- **Panels** (frosted glass): Work (selected + all), About (headline, story, education, learning, skills, journey, links, CV), Contact (form → Inbox), one per project. Hash URLs (#about, #work-<id>), Escape closes; `:target` fallback without JS.
- Short logo loader (CSS-timed). Hidden terminal (backtick key) kept as an Easter egg. Removed: boot sequence, starfield/planets, HUD/level, achievements, comet cursor, sound.
- Reduced motion / no WebGL / no JS: static 2D block poster + a normal project grid.
- Layout constants shared by scene, spacer and counter: `src/components/world/layout.ts`. Shared runtime state: `world/store.ts` (on globalThis, so the page bundle and the lazy 3D chunk share one copy).

## Admin — Mission Control (`/admin`, schema-driven: forms generated from the Zod schema)
- **Dashboard**: unpublished-changes counter + Publish, missing-content checklist (every TODO_EHSAN), unread messages, visits, last published.
- **Content**: Profile (name, currently, location + time zone, intro, portrait photo, logo, about headline + story, CV, education, learning), Projects (title, category, year, status, selected, summary, details, tags, cover + gallery, links — drag to reorder = flight order), Skills, Journey, Links, Labels. Rich text: bold, italic, links, lists.
- **Design**: presets (Ink, Paper, Midnight, Forest), colour tokens (background, text, muted, accent, panel, signature line) + pickers + contrast checker (warn < 4.5:1), display/italic/body fonts from a curated free list, name size, radius, glass blur/opacity; live preview.
- **Effects**: loader, block portrait (blocks per tier, gap, black & white amount, sparkle colours, depth, dust, brightness, shimmer, ripple, crop, size, offset), scroll flight, signature (path, width, opacity, timing, size), motion, quality-controller thresholds.
- **Terminal**: welcome, prompt, commands + every reply.
- **Media**: upload images/PDFs; auto WebP + resize; required alt text; where-used; replace/delete.
- **Inbox**: read/unread, reply via mailto, spam, delete, CSV export.
- **SEO**: title, description, OG image (upload or auto-generated), favicon, keywords, JSON-LD Person, indexing on/off.
- **History**: every publish = version; preview, compare date, one-click restore; export full backup (JSON + media list) and import.
- **Advanced**: custom CSS (scoped to public site, warning), maintenance mode ("Ehsan is upgrading the universe").
- **Account**: change password, sign out everywhere, recent login attempts.
- **Draft → Preview → Publish**: edits autosave to a draft; Preview renders the real site from the draft with a "Preview mode" badge; Publish stores a new version (keep last 30) and revalidates the live cache; Discard draft → last published; Restore any older version.
- Honest limit: brand-new animation/section *kinds* are code (ask Claude Code); once built they appear in admin automatically via the schema.

## Design tokens (defaults, all editable)
`--bg #0A0A0A` · `--fg` text · `--fg-muted` · `--accent #9DB8FF` · `--panel-bg #171717` (frosted glass) · `--line` (signature). Presets: Ink (default), Paper, Midnight, Forest.
Fonts via next/font (self-hosted): Instrument Serif (display + italic name), Inter Tight (body/UI); more curated free fonts declared without preload.
Motion: letters rise in, loader ≤ 1.3 s (0.45 s returning), portrait shatter + fly on scroll; no scroll-jacking. Reduced motion: static 2D block poster, project grid, fades only.
Tokens become CSS variables at render time → colour change needs no rebuild.

## Stack (all free — do not add others without asking)
Next.js (16.x App Router, Cache Components) + TypeScript · Tailwind CSS v4 · three.js + @react-three/fiber + @react-three/drei (client-only, lazy) · GSAP + ScrollTrigger, Motion, Lenis · Neon serverless Postgres + @neondatabase/serverless · Drizzle ORM + drizzle-kit · Zod · bcrypt(js) + jose (signed httpOnly cookie) · dnd-kit, TipTap, react-colorful · sharp · media stored in Neon served via cached route · GitHub → Vercel Hobby.

## DB tables (Drizzle, `src/db/schema.ts`)
- `site_versions`: id, status (draft/published/archived), data JSONB (entire site), note, created_at, published_at
- `media`: id, hash, filename, mime, bytes (bytea), width, height, size, alt, created_at
- `messages`: id, name, email, message, read, spam, created_at, ip_hash
- `stats`: key → counter (visits, unlock:<id>); once per visitor session
- `admin_user`: email, password_hash, session_version, updated_at
- `login_attempts`: ip_hash, created_at

## Caching
- Public page: `'use cache'` + `cacheTag('site')` + `cacheLife('max')` on the published-site read → static shell; Publish calls `updateTag('site')` (server action) → visitors ≈ 0 DB queries; Neon scales to zero.
- Media: `/media/<hash>.<ext>` with `Cache-Control: public, max-age=31536000, immutable` → read from Neon ~once, then CDN.
- Upload caps: images 4 MB in → max 1920 px, WebP q≈80 (<300 KB typ.); PDFs 5 MB.
- Admin code route-split, never shipped to public routes.

## Performance budget
Name+buttons readable ≤ 1.5 s 4G (boot excluded) · LCP ≤ 2.5 s mobile · public JS first load ≤ 200 KB gzip · 3D chunk ≤ 350 KB gzip · total first load ≤ 1.5 MB (photo ≤ 150 KB) · 60 fps desktop / ≥ 45 fps mid phone · CLS ≤ 0.05 · DB queries per visit ≈ 0 · Lighthouse mobile Perf ≥ 85, A11y ≥ 95, Best ≥ 95, SEO 100.

## Adaptive quality (closed-loop controller, `src/lib/fps.ts`)
| Tier | Hero particles | BG stars | DPR cap | Extras |
|---|---|---|---|---|
| High | 8000 | 4000 | 2.0 | all effects, glow |
| Medium | 4000 | 2000 | 1.5 | no glow post |
| Low | 1500 | 800 | 1.0 | no warp streaks, no comet trail |
| Reduced motion | 0 (static) | static image | — | fades only |
Initial tier from hardwareConcurrency, deviceMemory, screen size, touch. Feedback: avg FPS over 2 s window; drop one tier if < 40 fps for 2 s; raise only if > 58 fps for 5 s (hysteresis). Values admin-editable. Pause when tab hidden / canvas off-screen; no WebGL → static fallback.

## Accessibility + SEO
Semantic HTML, one h1, full keyboard nav, visible focus rings, canvases `aria-hidden`. Metadata, OG 1200×630, favicon, sitemap.xml, robots.txt, JSON-LD Person.

## Security checklist
- Single admin; bcrypt hash only; first password from `ADMIN_PASSWORD` during seed; changeable in admin.
- Session: signed (jose HS256) httpOnly, Secure, SameSite=Strict cookie, 7-day expiry; "sign out everywhere" bumps `session_version`.
- Every admin server action + API route verifies the session server-side (proxy is not trusted).
- Login rate limit: 5 failed / 15 min / IP; generic errors.
- All input Zod-validated; rich text sanitised (stored as whitelisted TipTap JSON, rendered by our own renderer); uploads checked by magic bytes; size caps.
- Contact: honeypot, per-IP rate limit, length limits. `/admin` noindex.
- Headers: CSP, X-Frame-Options, Referrer-Policy, etc. `.env*` gitignored.

## Folder structure
```
CLAUDE.md PROGRESS.md DEPLOY.md ADMIN_GUIDE.md .env.example assets_input/ drizzle/
src/app/(site)/page.tsx          public website
src/app/preview/                  draft preview (admin only)
src/app/media/[file]/route.ts     cached media delivery
src/app/admin/                    Mission Control (login, dashboard, sections, content, design, effects, game, media, inbox, seo, history, advanced, account)
src/app/api/                      contact, stats, upload, auth
src/schema/site.ts                Zod schema of the ENTIRE site
src/db/ (schema.ts, client.ts, seed.ts, migrate.ts)
src/lib/ (auth.ts, publish.ts, media.ts, rateLimit.ts, storage.ts, sound.ts, fps.ts, …)
src/components/ world/ (WebGL block portrait + flight) site/ (page, panels, signature) terminal/ ui/ admin/
```

## Phases (done when)
0. Foundation — Next+TS+Tailwind, deps, folders, CLAUDE.md, PROGRESS.md, .gitignore, git init, Neon string, Drizzle schema + first migration. **Done when** `npm run dev` works; tables exist in Neon.
1. Content model — Zod schema, seed with all defaults, public site renders every section from the published version (readable, 360–1920 px, no heavy effects). **Done when** all content readable on phone + desktop from the DB.
2. Admin core — login/logout, session, rate limit, layout, schema-driven forms, Sections manager, Content editors, Media library, draft → preview → publish, History/restore, export/import. **Done when** change a text → Publish → visible on site.
3. Universe — starfield, warp streaks, planets, mini-map, sky themes, Lenis + ScrollTrigger reveals, all from settings. **Done when** smooth on desktop; content still readable.
4. First impression — boot, Big Bang particle name, typewriter, HUD with computed level/XP. **Done when** name readable ≤ 3 s first visit, ≤ 1 s return; skip works.
5. Signature sections — constellation (+list), quest cards, journey orbit, lab oscilloscopes, signal station → Inbox, footer, custom section types. **Done when** all sections interactive on mouse + touch.
6. Magic layer — comet cursor, magnetic buttons, achievements engine (DB definitions), terminal (DB commands), Konami, secrets, shooting stars, Web Audio. **Done when** all achievements unlockable; terminal complete.
7. Studio — Design (tokens, presets, fonts, contrast, live preview), Effects, Game, SEO, Inbox, Advanced, Account. **Done when** every design/effect change previewable + publishable.
8. Optimise + secure — tiers + FPS controller, caching check, image pipeline, reduced motion, SEO/OG/JSON-LD, a11y audit, security checklist, prod build, Lighthouse. **Done when** §9 targets met; numbers reported.
9. Deploy prep — DEPLOY.md, ADMIN_GUIDE.md, production seed script, final review. Wait for Ehsan to push. **Done when** Ehsan can deploy following DEPLOY.md.

## Env vars
`DATABASE_URL` (Neon pooled; dev branch locally, main on Vercel) · `AUTH_SECRET` (32+ random chars, different per env) · `ADMIN_EMAIL` · `ADMIN_PASSWORD` (seed only, remove after) · `NEXT_PUBLIC_SITE_URL`.

## Next.js 16.4 notes (this repo)
- `cacheComponents: true` + `partialPrefetching: true`. Runtime reads (`cookies()`, `headers()`, uncached DB) must sit inside `<Suspense>` or call `connection()`; cached reads use `'use cache'` + `cacheTag` + `cacheLife`.
- `middleware` is renamed `proxy` (`src/proxy.ts`). `revalidateTag(tag, 'max')` needs 2 args; `updateTag(tag)` only inside server actions.
- Docs live in `node_modules/next/dist/docs/` — read before using an unfamiliar API.

## Operations (as built)
- Local DB without Neon: `npm run dev:local` (PGlite behind a Neon-HTTP-compatible shim, `scripts/local-db.mjs`, data in `.pglite/`). Same driver/code path as production. With a Neon URL in `.env.local`, use `npm run dev`.
- Migrations: edit `src/db/schema.ts` → `npm run db:generate` → `npm run db:migrate` (+ `db:migrate:prod` for live). Seed: `db:seed` / `db:seed:prod` (`--reset-admin`, `--reset-content`).
- New site fields: add to `src/schema/site.ts` with a default + `.meta({label, widget})` → appears in admin automatically; old saved versions get the default on parse.
- Public page = static shell from `getPublishedSite()` (`'use cache'`, tag `site`); publish → `updateTag('site')`. Admin/preview are dynamic behind `<Suspense>`.
- Client islands load lazily: 3D (`SpaceCanvas`, after boot; phones on first touch/scroll by default), magic layer (`MagicLazy`, idle), terminal window (first open), GSAP/Lenis (desktop only).
- Perf check: `npm run build && npm run start`, then `npm run budget` and Lighthouse (see `lighthouse/REPORT.md`).
- Docs for Ehsan: DEPLOY.md, ADMIN_GUIDE.md, README.md.
