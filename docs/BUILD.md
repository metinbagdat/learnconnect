# Build Process Documentation

This document explains the build process, requirements, and troubleshooting for the LearnConnect application.

## Overview

The project uses a monorepo structure with:
- **Frontend**: React + Vite (TypeScript)
- **Backend**: Express + Node.js (TypeScript)
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Build Tools**: Vite (frontend), esbuild (backend)

## Build Process

### Build Command

```bash
npm run build
```

This command executes:
1. `prebuild` hook: Verifies environment variables
2. `vite build`: Builds frontend React application
3. `node build-server.js`: Bundles server code with esbuild
4. `node build-vercel-api.js`: Builds Vercel API function (if exists)

### Build Output

- **Frontend**: `dist/public/` - Static files served to clients
- **Server**: `dist/index.js` - Bundled server application
- **Vercel API**: `api/index.js` - Vercel serverless function

## Prerequisites

### Environment Variables

Before building, ensure required environment variables are set. See [ENV.md](./ENV.md) for complete documentation.

**Required for Production:**
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key

**Optional:**
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payment processing
- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` - For PayPal payments

### Node.js Version

- **Required**: Node.js 20.x or higher
- **Recommended**: Node.js 20.x LTS

### Dependencies

Install dependencies before building:
```bash
npm install
```

## Build Verification Scripts

### Environment Variable Verification

```bash
npm run verify:env
```

Checks that all required environment variables are set. This runs automatically before `npm run build` via the `prebuild` hook.

### Import Verification

```bash
npm run verify:imports
```

Verifies that all TypeScript imports use correct extensions and paths.

### Server-Only Import Check

```bash
npm run verify:no-server-imports
```

Ensures no server-only packages (like `fs`, `express`, `openai`) are imported in frontend code.

### Full Build with Verification

```bash
npm run build:full
```

Runs all verification checks before building.

## Build Configuration

### Frontend (Vite)

Configuration: `vite.config.ts`

Key features:
- Path aliases: `@/` → `client/src/`, `@shared/` → `shared/`
- External Node-only packages to prevent frontend bundling
- Optimized vendor chunks for better caching
- Source maps for debugging

### Backend (esbuild)

Configuration: `build-server.js`

Key features:
- Bundles all server code into single file
- Preserves `@shared/*` path aliases
- Externalizes `node_modules` (not bundled)
- Generates source maps

### Vercel API

Configuration: `build-vercel-api.js`

Builds the serverless function at `api/index.ts` (if it exists).

## Troubleshooting

### Build Fails with Missing Environment Variables

**Error**: `❌ Verification FAILED - Missing required variables!`

**Solution**:
1. Create `.env` file in project root
2. Copy variables from `ENV.md`
3. Set required values
4. Run `npm run verify:env` to check

### Frontend Build Includes Node Modules

**Error**: Build succeeds but bundle size is very large (>2MB)

**Solution**:
- Check `vite.config.ts` `external` list
- Run `npm run verify:no-server-imports` to find problematic imports
- Ensure no direct imports of server-only packages in `client/src/`

### TypeScript Errors During Build

**Error**: Type errors prevent build

**Solution**:
- Run `npm run check` separately to see all type errors
- Build process continues with type errors (TypeScript checking is separate)
- Fix type errors for production readiness

### Vercel Build Fails

**Error**: Build timeout or function size limit exceeded

**Solution**:
- Check Vercel environment variables are set correctly
- Ensure `DATABASE_URL` and `SESSION_SECRET` are set for Production environment
- Review build logs in Vercel dashboard
- Check function size (should be <50MB compressed)

### Module Resolution Errors

**Error**: `Cannot find module` or `Module not found`

**Solution**:
- Verify path aliases in `tsconfig.json` match `vite.config.ts`
- Check import paths use `.js` extensions in ESM imports
- Run `npm run verify:imports` to find issues

## Development vs Production Builds

### Development

```bash
npm run dev
```

- Runs TypeScript directly with `tsx`
- No bundling - faster startup
- Full source maps and error details
- Hot module replacement (HMR) for frontend

### Production

```bash
npm run build
npm start
```

- Bundled and optimized code
- Smaller bundle sizes
- Environment variable verification
- Production-ready output

## Build Optimization

### Bundle Size

Current bundle sizes (approximate):
- Frontend: ~1.8MB (439KB gzipped)
- Server: ~1.5MB

To reduce bundle size:
- Use dynamic imports for large dependencies
- Split vendor chunks (already configured)
- Remove unused dependencies
- Optimize images and assets

### Build Performance

Build times (approximate):
- Frontend: ~30-40 seconds
- Server: ~0.5 seconds
- Total: ~35-45 seconds

To improve build time:
- Use faster CI/CD machines
- Enable build caching
- Reduce bundle size
- Skip optional verification steps in CI

## CI/CD Integration

### GitHub Actions

The build process works in CI/CD environments. Ensure:
1. Environment variables are set as secrets
2. `DATABASE_URL` is available (even for build)
3. `NODE_ENV=production` for production builds

### Vercel

Vercel automatically runs `npm run build` on deployment. The `prebuild` hook ensures environment variables are verified.

## Additional Resources

- [ENV.md](./ENV.md) - Environment variable documentation
- [README.md](./README.md) - Project overview
- [Vercel Deployment Guide](./DEPLOY_NOW.md) - Deployment instructions

