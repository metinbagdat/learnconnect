# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

LearnConnect is an AI-powered Turkish educational platform (TYT/AYT/LGS exam prep). It is a monorepo with:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn UI (root: `client/`)
- **Backend**: Express.js (TypeScript) on port 5000, with Vite dev middleware in dev mode
- **Database**: PostgreSQL via `@neondatabase/serverless` + Drizzle ORM
- **AI**: Anthropic Claude fallback chain (optional, degrades gracefully if key is placeholder)

### Running the dev server

The full-stack dev server (Express + Vite middleware) is started with:

```bash
node scripts/ws-proxy.mjs &   # WebSocket-to-PostgreSQL proxy (required for @neondatabase/serverless)
NODE_OPTIONS="--import ./scripts/local-dev-preload.mjs" npx tsx server/index.ts
```

The app is then available at `http://localhost:5000`. Both the API (`/api/*`) and frontend are served from the same port.

### Key gotchas

- **Node.js 20.x required** (`engines.node` in `package.json`). Node 22+ may cause issues.
- **@neondatabase/serverless requires a WebSocket proxy** for local PostgreSQL. The `scripts/ws-proxy.mjs` script proxies WebSocket connections on port 5488 to PostgreSQL on port 5432. The `scripts/local-dev-preload.mjs` script configures neonConfig to use this proxy. Both must be running before the server starts.
- **Express 4.x required** (not 5.x). Express 5 uses `path-to-regexp` v8+ which rejects optional route params (`/:param?`) used in the codebase.
- **`@paypal/paypal-server-sdk@1`** is needed (v2 has incompatible API exports).
- **`ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL`** must be set in `.env` even if placeholder values, because `server/lib/anthropic-client.ts` and `server/ai/ai-reasoning.engine.ts` throw at import time if missing.
- **`vite.config.ts` `optimizeDeps.include`** must use `"firebase/app"` (not bare `"firebase"`) since Firebase has no root "." export in its package.json.
- **No lockfile exists** — dependency versions are not pinned. Use `npm install` with the versions specified in `package.json`.
- **No ESLint config** — the project doesn't use a linter.
- **TypeScript errors are pre-existing** — `tsconfig.json` has `strict: false` and many strictness options disabled.

### Database setup

PostgreSQL must be running locally. Schema is pushed with `npx drizzle-kit push --force`. The session table for `connect-pg-simple` is in `migrations/create-sessions-table.sql`.

### Build

```bash
npm run build   # Vite build + CSS cleanup check
```

### Environment variables

See `.env.example`. Minimum required: `DATABASE_URL`, `SESSION_SECRET`, `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`.
