# ADMIN_GUIDE.md — Mission Control (`/admin`)

Everything on the public site comes from the database and can be changed here — no code, no push.

## The golden loop: Edit → Preview → Publish

- Every change **autosaves to a draft** ("Draft saved ✓"). Visitors never see drafts.
- The top bar shows **N unpublished changes**.
- **Preview ↗** opens the real site rendered from your draft (gold "Preview mode" badge; missing `TODO_EHSAN` fields show as dashed hints).
- **Publish** makes the draft live in seconds (optionally with a note). **Discard** throws the draft away.
- Every publish is kept in **History** (last 30): Preview, **Restore** (makes it live again) or **Edit as draft**.

## Areas

| Area | What you can do |
|---|---|
| **Dashboard** | Unpublished changes, **missing-content checklist** (every `TODO_EHSAN`, with links), unread messages, visits, achievement unlock counts, last published time. |
| **Sections** | Drag ⋮⋮ to reorder, toggle visibility, ⧉ duplicate, ✕ delete, ▾ edit (title, subtitle, nav label, #anchor, planet colour/size/ring, background mood). Add: About, Skills, Quests, Journey, Lab, Contact, Custom text, Custom cards, Gallery, Video/Link embed, Quote, Call-to-action. |
| **Content** | Profile (name, taglines, bio with bold/italic/links/lists, photo, CV, stats, interests = orbit moons, fun facts, jokes), Socials, Skills (branches + skills: Mastered / Learning / Locked), Quests, Journey, Lab, **Labels & micro-copy** (every button and label on the site). |
| **Design** | Presets (Deep Space, Nebula, Aurora, Midnight Gold), colour tokens with pickers, **contrast checker** (warns below 4.5 : 1), fonts (curated free list), radius, glass blur/opacity, button + cursor style, spacing — with a **live preview**. |
| **Effects** | Boot (lines, durations, show-once, night line), particles (count per quality tier, repel, spring, damping, colours), starfield + warp, shooting stars, sky themes (hour ranges + colours), sound, comet cursor, Konami, motion, **quality controller** (tier thresholds, phones' 3D start). Live preview included. |
| **Game** | HUD labels, level titles, XP rules (your level is computed from skills/quests/journey), achievements, terminal commands + replies. |
| **Media** | Upload images (auto-resized to ≤ 1920 px WebP) and PDFs. Alt text required. See where a file is used, **Replace** (updates every use in the draft), delete (blocked while in use). |
| **Inbox** | Contact messages: read/unread, reply by email, spam, delete, **Export CSV**. |
| **SEO & sharing** | Title, description, keywords, share image (empty = auto-generated card at `/og`), favicon, "Allow search engines", JSON-LD job title. |
| **History** | Versions, preview, restore, **Export backup** (JSON + media list) and **Import backup** (into the draft). |
| **Advanced** | Custom CSS for the public site (preview first!), **Maintenance mode** ("Ehsan is upgrading the universe"). |
| **Account** | Change password (signs out other devices), **Sign out everywhere**, recent login attempts. |

## Achievements — trigger types

| Trigger | Parameter | Example |
|---|---|---|
| Visit | — | Hello World |
| Scroll to section | element id / section anchor (`footer`, `skills`, …) | Explorer → `footer` |
| Click element N times | element id (`profile-photo`) + "Times needed" | Persistent → 5 |
| Terminal command | exact text | sudo → `sudo hire ehsan` |
| Time window | `HH-HH` local time (wraps midnight, e.g. `22-03`) | Night Owl → `00-05` |
| Key sequence | keys separated by spaces (`ArrowUp ArrowUp … b a`) | Konami Master |
| Contact form sent | — (also fires on the email button) | First Contact |
| Built-in event | `shooting-star`, `skill-inspect` (counts distinct stars), `terminal-open`, `email-click` | Wish Granted, Stargazer, Curious Mind |

Progress is stored in each visitor's browser; the dashboard counts unlocks anonymously.

## Terminal

Built-in commands (help, whoami, about, skills, projects, open, cv, contact, socials, theme, sound, achievements, matrix, sudo, coffee, joke, clear, exit) can be **renamed, disabled or re-worded**. Add your own text commands with **+ Add**.
Placeholders in replies: `{name}` = short name, `{role}`, `{arg}` = what was typed after the command.
Visitors open it with the <kbd>`</kbd> / <kbd>~</kbd> key or the `>_` button.

## Good to know

- **TODO_EHSAN** values are hidden on the live site (links and stats with placeholders don't show) and listed on the Dashboard.
- **Quality tiers**: the site measures its own frame rate and lowers/raises particle counts automatically. Phones start on *Low*. By default, phones start the 3D universe on the first touch or scroll (fastest loading) — change it in Effects → Quality controller.
- **Reduced motion**: visitors with "reduce motion" switched on get a calm version (no boot, no particles, fades only).
- Images are served from permanent, cached URLs; replacing a file creates a new URL automatically.
- Changing code (new kinds of sections/effects) is done by asking Claude Code in the project folder; once built, new fields appear here automatically.
