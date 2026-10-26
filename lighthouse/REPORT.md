# Phase 8 — performance, accessibility & security report

Measured on 2026-10-26 against a local **production** build (`npm run build && npm run start`),
Lighthouse 12 (default mobile = Moto G Power emulation, simulated slow 4G + 4× CPU slowdown),
three mobile runs + one desktop run, first visit (empty storage → full 2.5 s boot sequence).

## Lighthouse

| Run | Performance | Accessibility | Best practices | SEO | FCP | LCP* | TBT | CLS | Speed Index |
|---|---|---|---|---|---|---|---|---|---|
| Mobile #1 | **91** | 100 | 100 | 100 | 1.1 s | 3.1 s | 80 ms | 0.003 | 4.0 s |
| Mobile #2 | **89** | 100 | 100 | 100 | 1.1 s | 3.2 s | 90 ms | 0.002 | 5.4 s |
| Mobile #3 | **91** | 100 | 100 | 100 | 1.1 s | 3.1 s | 80 ms | 0.003 | 4.0 s |
| Desktop | **97** | 100 | 100 | 100 | 0.3 s | 0.7 s | 0 ms | 0.001 | 1.7 s |
| /admin/login | — | 100 | 100 | (noindex by design) | | | | | |

\* *LCP*: the **observed** LCP (the hero `<h1>`, real HTML) is **≈ 0.35 s**. Lighthouse's *simulated*
mobile LCP (~3.1 s) models every script and font discovered early on a slow 4G link; it stays
above the 2.5 s target. Speed Index includes the deliberate 2.5 s first-visit boot overlay
(returning visitors get a 0.6 s mini boot; reduced-motion visitors none).

## Budget (`node scripts/budget.mjs`, gzip)

| Item | Measured | Budget | |
|---|---|---|---|
| Public JS, first load | 148.7 KB | ≤ 200 KB | ✓ |
| 3D chunk (three.js + r3f, lazy) | 238.9 KB | ≤ 350 KB | ✓ |
| Total first load (HTML 22 + CSS 15 + JS 149 + preloaded fonts 109) | ≈ 294 KB | ≤ 1.5 MB | ✓ |
| Admin libraries on public pages | none | none | ✓ |
| DB queries per public visit | **0** (15 requests → 0 queries) | ≈ 0 | ✓ |
| Frame rate (desktop, high tier) | ~120 fps (144 Hz screen) | 60 fps | ✓ |

## What was done to get there

- **CLS 0.12 → 0.003**: the typewriter line has a fixed height (2 lines on phones), so typing never moves the buttons.
- **Hero layout**: off-screen sections use `content-visibility: auto` (initial layout 105 → 59 ms unthrottled); ScrollTrigger refreshes when their real size arrives.
- **Start-up work moved out of hydration**: the WebGL capability check, journey path measuring and lab canvases now run only when needed/visible; the magic layer (achievements, terminal launcher, cursor, shooting stars) loads at idle.
- **Phones**: start on the *Low* quality tier and earn their way up via the FPS controller; no GSAP/Lenis download (IntersectionObserver reveals instead); the WebGL universe starts on the **first touch or scroll** (admin: *Effects → Quality controller → Phones: when does the 3D universe start?*). With "immediately", mobile Performance is ≈ 83–85.
- **Particles sleep** when settled (no physics, no GPU upload) and wake on pointer/scroll; a tier change rebuilds them in place (no second Big Bang).

## Reduced motion / no WebGL

`prefers-reduced-motion`: no boot overlay, no particles or starfield (static CSS star image), no smooth
scroll, no tilt, no shooting stars, no comet cursor, no matrix/confetti, static oscilloscopes, fades only.
No WebGL: the same static star image; everything else works.

## Security checklist (spec §10)

- [x] Single admin, bcrypt (cost 12) hash only; first password from `ADMIN_PASSWORD` in the seed; changeable in Account.
- [x] Session: jose HS256 JWT in an httpOnly, Secure (production), SameSite=Strict cookie, 7-day expiry; "sign out everywhere" bumps `session_version` (password change does too).
- [x] Every admin page, server action and admin API route re-checks the session on the server (`requireAdmin` / `assertAdmin` / `getSession`); the proxy redirect is convenience only.
- [x] Login rate limit: 5 failed attempts / 15 min / hashed IP; generic error; constant-time-ish compare with a dummy hash for unknown emails.
- [x] Zod validation everywhere; rich text stored as whitelisted JSON and rendered by our own renderer (no HTML); links limited to http(s)/mailto/#/; uploads checked by magic bytes (SVG refused), 4 MB images / 5 MB PDFs, re-encoded with sharp.
- [x] Contact: same-origin check, honeypot, 2.5 s minimum fill time, 3 messages / 10 min / hashed IP, length limits. `/admin` + `/preview` are noindex (meta, `X-Robots-Tag`, robots.txt).
- [x] Headers: CSP (no external scripts; frames only self/YouTube-nocookie/Vimeo; `frame-ancestors 'none'` except /preview → self), X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS; `X-Powered-By` removed.
- [x] Secrets only in `.env.local` / Vercel env; `.env*` gitignored (`.env.example` committed). IPs are stored only as salted hashes.
- [x] CSV export neutralises spreadsheet formulas; custom CSS cannot close its `<style>` tag; JSON-LD escapes `<`.
