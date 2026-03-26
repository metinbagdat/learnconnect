# Deploy LearnConnect to Vercel

Yerelde `npm` çalışmıyorsa: build **Vercel sunucularında** yapılır; akış için bkz. [REMOTE_WORKFLOW_GITHUB_VERCEL.md](./REMOTE_WORKFLOW_GITHUB_VERCEL.md).

**Kurulum komutu:** [`vercel.json`](../vercel.json) şu an `installCommand: npm install` (lock dosyası gecikmiş ortamlarda `npm ci` hatasını önlemek için). Lock senkron olduktan sonra isterseniz `npm ci`ye dönebilirsiniz — bkz. [CONTINUE_STUDY_TRACK.md](./CONTINUE_STUDY_TRACK.md).

## Prerequisites

- A [Vercel](https://vercel.com) account (GitHub login is fine).
- Node 20.x (matches `package.json` `engines`).

## Option A: GitHub (recommended) — [metinbagdat/learnconnect](https://github.com/metinbagdat/learnconnect)

1. **Code on GitHub:** Your app lives at [github.com/metinbagdat/learnconnect](https://github.com/metinbagdat/learnconnect). Commit and push any local changes (`git push origin main`) so Vercel builds the latest code.

2. **Connect Vercel to GitHub (first time only):** In [Vercel](https://vercel.com) → **Account Settings** → **Git** → connect **GitHub** and allow access to the `learnconnect` repo (or “All repositories”).

3. **Import the project:** Open **[vercel.com/new](https://vercel.com/new)** → **Add New…** → **Project** → find **`metinbagdat/learnconnect`** → **Import**.

4. **Framework preset:** Vercel usually picks **Vite**. Confirm it matches [`vercel.json`](../vercel.json):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - **Root Directory:** leave empty (repo root).

5. Add **Environment Variables** before deploy (or under Project → Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Strong random string for signed session cookies |
| `DATABASE_URL` | Neon Postgres connection string (optional; TYT APIs use mocks without it) |
| `RESEND_API_KEY` | Resend API key for password reset emails |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `onboarding@resend.dev` |
| `GROQ_API_KEY` | Groq API key (optional AI fallback) |
| `OPENAI_API_KEY` | OpenAI key (optional; primary for some AI routes) |

6. Click **Deploy**.

7. **Automatic deploys:** Every push to your production branch (usually `main`) triggers a new deployment on Vercel.

**Production URL:** Your README/deployment may already use something like `learn-connect-alpha.vercel.app`; you can add a custom domain under **Project → Settings → Domains**.

**Firebase / client env:** If the app needs `VITE_*` variables, add them in Vercel as well (they are baked in at build time). See [ADD_ENV_VARS.md](../ADD_ENV_VARS.md) or project root `COPY_TO_VERCEL_ENV.txt` if you use those files.

## Option B: Vercel CLI

From the project root:

```bash
npm i -g vercel
vercel login
vercel link    # first time: link to a Vercel project
vercel --prod
```

Set the same environment variables in the Vercel dashboard or:

```bash
vercel env add SESSION_SECRET
```

## Build note

Vite is configured with **`root: client`** so [`client/index.html`](../client/index.html) is the React entry. The static [`index.html`](../index.html) at repo root is not used for the app build.

## API routes

Files under [`api/`](../api/) deploy as serverless functions. Paths match the folder structure, e.g.:

- `/api/login` → `api/login.js`
- `/api/tyt/profile` → `api/tyt/profile.js`

## Troubleshooting

- **Build fails:** Run `npm install && npm run build` locally.
- **404 on client routes:** `vercel.json` rewrites non-`/api/*` requests to `/index.html` for SPA routing.
- **API 500:** Check function logs in Vercel → Project → Deployments → **Functions** / **Logs**.
