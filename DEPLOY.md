# DEPLOY.md — from your computer to the internet (all free)

You will do three things once: **Neon** (the database), **GitHub** (stores the code), **Vercel** (runs the site).
Total time: about 30–45 minutes. You never need a credit card.

> Words used below
> - **Terminal**: in VS Code press <kbd>Ctrl</kbd>+<kbd>`</kbd>. All commands are typed in the project folder `E:\abidwebsite`.
> - **Connection string**: a long line starting with `postgresql://…` that tells the app where the database is. Treat it like a password.

---

## 0. Test locally first (5 min)

Right now the project uses a **local practice database** (PGlite, a real Postgres inside Node — no account needed).

```bash
npm install
```

```bash
npm run dev:local
```

Open <http://localhost:3000> (the site) and <http://localhost:3000/admin> (Mission Control).
Log in with `ADMIN_EMAIL` and the temporary `ADMIN_PASSWORD` you'll find in `.env.local`.
Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal to stop.

Try: Admin → Content → change a tagline → **Publish** → reload the site.

---

## 1. Neon — create the database (10 min)

1. Go to <https://neon.tech> → **Sign up** (log in with GitHub or Google is easiest). Free plan.
2. **Create project** → name `ehsan-portfolio`, region **closest to Bangladesh** (e.g. *AWS Asia Pacific – Singapore*), Postgres version: default.
3. Neon creates a branch called **main** — this will be the **live** database.
4. Create a second branch for testing: left menu **Branches → New branch** → name `dev` (from `main`).
5. Get the connection strings: **Dashboard → Connect** →
   - choose branch **dev**, make sure **Connection pooling** is **ON** (the host contains `-pooler`), copy the string;
   - do the same for branch **main** and keep it for step 4.

### Use Neon (dev branch) on your computer

Open `.env.local` in VS Code and replace the `DATABASE_URL` line with your **dev** string:

```
DATABASE_URL="postgresql://…-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
```

Also set your real admin login (12+ characters):

```
ADMIN_EMAIL="ehsanahmedabid@gmail.com"
ADMIN_PASSWORD="choose-a-long-password"
```

Save the file (<kbd>Ctrl</kbd>+<kbd>S</kbd>), then create the tables and the first content:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

From now on use plain `npm run dev` (no local database needed). Check <http://localhost:3000> again.

> Photo / CV: put files in the `assets_input/` folder **before** `npm run db:seed` and they are optimised and added automatically
> (a file named like `photo.jpg` becomes the profile photo, `cv.pdf` the CV). You can also upload them later in Admin → Media.

---

## 2. GitHub — store the code (5 min)

1. On <https://github.com/new> create a repository, e.g. `ehsan-portfolio`. **Private** or public — both are fine.
   Do **not** add a README, .gitignore or license (the project already has them).
2. In the terminal (replace `YOUR-USERNAME`):

```bash
git remote add origin https://github.com/YOUR-USERNAME/ehsan-portfolio.git
```

```bash
git push -u origin main
```

(If Git asks you to log in, a browser window opens — approve it.)
Your secrets are safe: `.env.local` is in `.gitignore` and is **never** uploaded. You can check with `git status` — it must not list `.env.local`.

---

## 3. Prepare the live database (Neon `main` branch) (5 min)

Create a new file in the project folder called **`.env.production.local`** (also gitignored) with:

```
DATABASE_URL="postgresql://… your MAIN branch pooled string …"
ADMIN_EMAIL="ehsanahmedabid@gmail.com"
ADMIN_PASSWORD="your-real-strong-password"
```

Then run, in this order:

```bash
npm run db:migrate:prod
```

```bash
npm run db:seed:prod
```

You should see `published the default site version`. **After this, delete the `ADMIN_PASSWORD` line** from `.env.production.local`
(the password is now stored only as a bcrypt hash in Neon).

> Why before Vercel? Vercel builds the homepage from the database, so the tables must exist first.

---

## 4. Vercel — put it online (10 min)

1. Go to <https://vercel.com> → **Sign up with GitHub** (Hobby plan, free).
2. **Add New… → Project** → find `ehsan-portfolio` → **Import**. Framework is detected as **Next.js** — leave the build settings as they are.
3. Open **Environment Variables** and add (for *Production*, *Preview* and *Development*):

| Name | Value |
|---|---|
| `DATABASE_URL` | the Neon **main** pooled string |
| `AUTH_SECRET` | a **new** random secret (run the command below and paste the output) |
| `ADMIN_EMAIL` | `ehsanahmedabid@gmail.com` |
| `NEXT_PUBLIC_SITE_URL` | `https://ehsan-portfolio.vercel.app` (your real Vercel URL; you can fix it after the first deploy) |

```bash
node -e "console.log(require('crypto').randomBytes(36).toString('base64url'))"
```

Do **not** add `ADMIN_PASSWORD` to Vercel.

4. Click **Deploy**. After 1–2 minutes you get a URL like `https://ehsan-portfolio.vercel.app`.
5. If the URL differs from what you typed in `NEXT_PUBLIC_SITE_URL`: Vercel → Project → **Settings → Environment Variables** → edit it → **Deployments → … → Redeploy**.

---

## 5. First login on the live site (5 min)

1. Open `https://YOUR-SITE.vercel.app/admin` and log in.
2. **Account → Change password** (recommended once).
3. **Dashboard → Missing-content checklist**: fill in every `TODO_EHSAN` item (bio, LinkedIn, GitHub, email, semester…).
4. **Media**: upload your photo (square, ≥ 800 px) and CV (PDF) and pick them in **Content → Profile**.
5. Press **Preview ↗** to check, then **Publish**. The live site updates within seconds.

Launch checklist (spec §16): open the site on your phone with mobile data; turn on "Reduce motion" on the phone and reload;
send yourself a message from the contact form (it appears in **Inbox**); paste the link into a private LinkedIn message to see the preview card;
add the URL to LinkedIn (Contact info → Website, and Featured).

---

## 6. Optional: your own domain

Vercel → Project → **Settings → Domains** → add `yourname.com` and follow the DNS steps. Then update `NEXT_PUBLIC_SITE_URL` to the new address and **Redeploy**.

---

## Everyday workflow

| You want to… | Do this | Goes live |
|---|---|---|
| Change text, images, colours, effects, sections | Admin → edit → **Publish** | seconds (no push) |
| Change code / add a feature | Ask Claude Code in this folder → test with `npm run dev` → `git push` | Vercel redeploys in 1–2 min |
| Change the database structure | Claude Code tells you; then run `npm run db:migrate` (dev) **and** `npm run db:migrate:prod` | — |

Keep `dev` and `main` separate: experiment locally on the **dev** branch; the live site always reads **main**.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Vercel build fails with `relation "site_versions" does not exist` | You skipped step 3. Run `npm run db:migrate:prod` and `npm run db:seed:prod`, then Redeploy. |
| Site says "no published universe found" | Run `npm run db:seed:prod`, then in Admin press Publish (or Redeploy). |
| `DATABASE_URL is not set` | The variable is missing in `.env.local` / Vercel → add it and restart / redeploy. |
| Can't log in: "Too many attempts" | Wait 15 minutes (brute-force protection). |
| Forgot the admin password | Put a new `ADMIN_PASSWORD` in `.env.production.local` and run `npm run db:seed:prod -- --reset-admin`, then remove the line again. |
| Images upload fails | Max 4 MB for images, 5 MB for PDFs (Vercel's own request limit is 4.5 MB, so keep PDFs under ~4.4 MB). |
| Neon "compute is suspended" first request slow | Normal on the free plan: Neon sleeps when idle; the first admin request wakes it (~1 s). Visitors are served from cache. |
