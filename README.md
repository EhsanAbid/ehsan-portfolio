# ehsan.exe — portfolio

Personal portfolio of **Ehsan Ahmed Abid** (BSc CSE, East West University) with an admin panel ("Mission Control").
Ehsan's face is built from thousands of small textured blocks (WebGL) with his signature writing itself behind it;
scrolling shatters the face and flies the camera through his projects. Everything is editable in `/admin`.

**Stack (all free):** Next.js 16 (App Router, Cache Components) · TypeScript · Tailwind CSS 4 · three.js + react-three-fiber ·
GSAP + Lenis · Neon Postgres + Drizzle · Zod · jose + bcrypt · TipTap · dnd-kit · sharp · Vercel.

## Quick start

```bash
npm install
npm run dev:local      # local practice database + dev server (no account needed)
```

- Site: <http://localhost:3000> · Admin: <http://localhost:3000/admin> (credentials in `.env.local`)
- Going live: **[DEPLOY.md](DEPLOY.md)** · Using the admin: **[ADMIN_GUIDE.md](ADMIN_GUIDE.md)**
- Spec summary + rules for Claude Code: [CLAUDE.md](CLAUDE.md) · Progress: [PROGRESS.md](PROGRESS.md) · Performance: [lighthouse/REPORT.md](lighthouse/REPORT.md)

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (uses `DATABASE_URL` from `.env.local`) |
| `npm run dev:local` | Local PGlite database + dev server together |
| `npm run build` / `npm run start` | Production build / server |
| `npm run db:migrate` / `db:seed` | Create tables / admin + first content (`.env.local`) |
| `npm run db:migrate:prod` / `db:seed:prod` | Same for the live database (`.env.production.local`) |
| `npm run db:generate` | New migration after changing `src/db/schema.ts` |
| `npm run budget` | Performance budget check against a running production server |
| `npm run lint` / `typecheck` | Code checks |

## How it fits together

```
src/schema/site.ts      ← one Zod schema describes the WHOLE site (single source of truth)
        │  admin forms are generated from it (components/admin/SchemaForm)
        ▼
Neon: site_versions     ← draft / published / archived JSON documents
        │  'use cache' + cacheTag('site')  → static page, 0 DB queries per visit
        ▼
src/components/site/SitePage.tsx  ← renders sections; client "islands" add the magic lazily
```

Interesting code to read (commented for learning): `src/components/hero/HeroParticles.tsx` (spring physics),
`src/components/space/Starfield.tsx` (GPU shader warp), `src/lib/fps.ts` (adaptive quality controller),
`src/lib/auth.ts` (sessions), `src/lib/site.ts` + `src/lib/publish.ts` (caching and publishing),
`src/components/admin/schemaUtils.ts` (schema-driven forms).
