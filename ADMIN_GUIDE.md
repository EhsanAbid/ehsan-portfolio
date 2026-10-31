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
| **Dashboard** | Unpublished changes, **missing-content checklist** (every `TODO_EHSAN`, with links), unread messages, visits, last published time. |
| **Content** | **Profile** (name, Currently, Based in + time zone, intro, the portrait photo that becomes the block face, logo, About headline + story, CV, education, currently learning), **Projects** (each one flies through the 3D view in this order: title, category, year, cover image, gallery, links, “Selected work”), Skills, Journey, Links, **Labels & micro-copy** (every button and label). |
| **Design** | Presets (Ink, Paper, Midnight, Forest), colour tokens with pickers, **contrast checker** (warns below 4.5 : 1), display + body fonts (curated free list), name size, radius, glass blur/opacity — with a **live preview**. |
| **Effects** | Loader; **block portrait** (how many blocks, gap, how black & white, sparkle colours, 3D depth, dust, brightness, shimmer, mouse ripple, photo crop, size and position); scroll flight; **signature** (paste your real signature as an SVG path, line width, speed, size); motion; quality controller. Live preview included. |
| **Terminal** | The hidden terminal (backtick key): welcome text, prompt, commands and every reply. |
| **Media** | Upload images (auto-resized to ≤ 1920 px WebP) and PDFs. Alt text required. See where a file is used, **Replace** (updates every use in the draft), delete (blocked while in use). |
| **Inbox** | Contact messages: read/unread, reply by email, spam, delete, **Export CSV**. |
| **SEO & sharing** | Title, description, keywords, share image (empty = auto-generated card at `/og`), favicon, "Allow search engines", JSON-LD job title. |
| **History** | Versions, preview, restore, **Export backup** (JSON + media list) and **Import backup** (into the draft). |
| **Advanced** | Custom CSS for the public site (preview first!), **Maintenance mode** ("Ehsan is upgrading the universe"). |
| **Account** | Change password (signs out other devices), **Sign out everywhere**, recent login attempts. |

## Terminal

Built-in commands (help, whoami, about, skills, projects, open, cv, contact, socials, sudo, coffee, joke, clear, exit) can be **renamed, disabled or re-worded**. Add your own text commands with **+ Add**.
Placeholders in replies: `{name}` = short name, `{role}`, `{arg}` = what was typed after the command.
Visitors open it with the <kbd>`</kbd> / <kbd>~</kbd> key or the `>_` button.

## Good to know

- **The block face** is generated from your portrait photo (Content → Profile). A PNG with a transparent background works best; your real photo itself is never shown on the site.
- **Projects** appear in the 3D flight only when they exist. Add a cover image for a picture card — its image also becomes part of the face's texture tiles.
- **Signature**: the built-in “Abid” can be replaced in Effects → Signature by pasting your real signature as one SVG path (1000×400 box).
- **Quality tiers**: the site measures its own frame rate and lowers/raises the number of blocks automatically.
- **Reduced motion**: visitors with “reduce motion” switched on get a still block portrait and a normal project grid.
- Images are served from permanent, cached URLs; replacing a file creates a new URL automatically.
- **TODO_EHSAN** values are hidden on the live site and listed on the Dashboard.
