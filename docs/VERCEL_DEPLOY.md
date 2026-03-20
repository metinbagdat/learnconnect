# Deploy LearnConnect to Vercel

## Prerequisites

- A [Vercel](https://vercel.com) account (GitHub login is fine).
- Node 20.x (matches `package.json` `engines`).

## Option A: GitHub (recommended)

1. Push this repo to GitHub (if not already).
2. Go to [vercel.com/new](https://vercel.com/new) → **Import** your repository.
3. Vercel will read [`vercel.json`](../vercel.json):
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. Add **Environment Variables** (Project → Settings → Environment Variables):

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Strong random string for signed session cookies |
| `DATABASE_URL` | Neon Postgres connection string (optional; TYT APIs use mocks without it) |
| `RESEND_API_KEY` | Resend API key for password reset emails |
| `RESEND_FROM_EMAIL` | Verified sender, e.g. `onboarding@resend.dev` |
| `GROQ_API_KEY` | Groq API key (optional AI fallback) |
| `OPENAI_API_KEY` | OpenAI key (optional; primary for some AI routes) |

5. Click **Deploy**.

Production URL will look like: `https://<project>.vercel.app`

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
