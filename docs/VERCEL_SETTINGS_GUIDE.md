# Vercel Settings Guide for Vite + React Projects

## Overview

This guide explains Vercel settings as they apply to **Vite + React + Express** projects (NOT Next.js).

## Framework Settings

### Auto-Detection
- Vercel automatically detects Vite from `vite.config.ts`
- No manual framework configuration needed
- Framework settings mismatch warnings in dashboard can be ignored
- Vercel correctly identifies the project type during build

### Configuration Files
- `vite.config.ts` - Vite build configuration
- `vercel.json` - Vercel deployment configuration
- `package.json` - Build scripts and dependencies

## Deployment Configuration

### Production Branch
- **Location:** Vercel Dashboard → Settings → Build and Deployment → Production Branch
- **Default:** `main`
- **Purpose:** Branch that triggers production deployments
- **Note:** This is a project setting, NOT in `vercel.json`

### Build Command
- **Location:** `vercel.json` → `buildCommand`
- **Current:** `npm run build:vercel || npm run build`
- **Purpose:** Command to build the application
- **Note:** Uses fallback to `npm run build` if `build:vercel` fails

### Output Directory
- **Location:** `vercel.json` → `outputDirectory`
- **Current:** `dist/public`
- **Purpose:** Where Vercel looks for built files
- **Note:** Vite builds to this directory

## Custom Domain Assignment

### Configuration
- **Location:** Vercel Dashboard → Settings → Domains
- **Domain:** `egitim.today`
- **Assignment:** Automatic (after deployment succeeds)
- **Blocking:** Deployment checks must pass before domain assignment

### Troubleshooting
- If domain is not assigned, check deployment status
- Failed deployment checks block domain assignment
- Promote a successful deployment to production

## Cron Jobs

### Configuration
- **Location:** `vercel.json` → `crons`
- **Current Configuration:**
  ```json
  {
    "crons": [
      {
        "path": "/api/cron",
        "schedule": "0 10 * * *"
      }
    ]
  }
  ```
- **Schedule Format:** Cron expression (UTC)
- **Example:** `"0 10 * * *"` = Daily at 10:00 UTC

### Endpoint Requirements
- Must be a GET endpoint
- Must validate `Authorization: Bearer <CRON_SECRET>` header
- Must return 200 status for success
- Environment variable `CRON_SECRET` must be set in Vercel dashboard

### Adding Environment Variable
1. Go to: Vercel Dashboard → Settings → Environment Variables
2. Add: `CRON_SECRET` with a secure random token
3. Select: Production environment
4. Redeploy after adding

## Directory Listing

### Default Behavior
- **Status:** Disabled by default
- **Reason:** Security best practice
- **Recommendation:** Keep disabled
- **Note:** Not configurable in `vercel.json` for Vite projects

### If Needed
- Create an `index.html` file in directories you want to list
- Or implement a custom API endpoint to list files
- Directory listing is not recommended for production

## Version Consistency

### Setting
- **Location:** Vercel Dashboard → Settings → Build and Deployment
- **Default:** Enabled
- **Purpose:** Ensures client and server versions stay in sync
- **Recommendation:** Keep enabled
- **Note:** Prevents mismatches between frontend and backend

## Redirect Limits

### Configuration
- **Location:** `vercel.json` → `redirects`
- **Default Limit:** 1,024 redirects
- **Maximum:** 1,024 redirects (cannot be increased)
- **Current Usage:** Configured in `vercel.json` if needed

### Best Practices
- Use `rewrites` instead of `redirects` when possible
- Keep redirect list under 1,024 entries
- Use pattern matching for multiple redirects
- Consider using `routes` for complex routing

## Cold Start Prevention

### Configuration
- **Location:** `vercel.json` → `functions`
- **Current Configuration:**
  ```json
  {
    "functions": {
      "api/index.ts": {
        "maxDuration": 30
      }
    }
  }
  ```
- **Options:**
  - `maxDuration`: Maximum execution time (seconds)
  - `memory`: Memory allocation (not set = default)

### Best Practices
- Set appropriate `maxDuration` for API routes
- Use edge functions for fast responses when possible
- Consider function region placement
- Monitor function execution times

## Function Configuration

### API Routes
- **Location:** `api/index.ts`
- **Type:** Serverless function
- **Configuration:** Set in `vercel.json` → `functions`
- **Timeout:** 30 seconds (configurable)

### Build Output
- **Location:** `dist/` directory
- **Server Code:** Built to `dist/index.js`
- **Client Code:** Built to `dist/public/`
- **API Routes:** Handled by `api/index.ts`

## Environment Variables

### Required Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Session encryption key
- `CRON_SECRET` - Cron job authorization token (for cron jobs)

### Optional Variables
- `OPENAI_API_KEY` - For AI features
- `ANTHROPIC_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payments
- `STRIPE_PUBLISHABLE_KEY` - For payments

### Setting Variables
1. Go to: Vercel Dashboard → Settings → Environment Variables
2. Add variable name and value
3. Select environments (Production, Preview, Development)
4. Redeploy after adding/modifying

## Build Optimization

### Current Settings
- **Minification:** Enabled (esbuild)
- **Tree Shaking:** Enabled
- **Code Splitting:** Enabled (manual chunks)
- **Source Maps:** Disabled in production

### Configuration
- **Location:** `vite.config.ts`
- **Build Command:** `vite build`
- **Output:** `dist/public/`

## Deployment Checks

### Current Issue
- "Create Neon Branch & Run Migrations" check fails on production
- This check should only run on Pull Requests
- **Solution:** Configure check to run only on PRs (requires dashboard access)

### GitHub Actions
- Workflow: `.github/workflows/neon-branch-pr-with-migrations.yml`
- Correctly configured: Only runs on PRs
- Issue: Vercel deployment check configuration

## Auto-Alias and Auto-Deployment

### Settings
- **Auto-Alias:** Enabled in `vercel.json` → `github.autoAlias`
- **Auto-Deployment:** Enabled by default for main branch
- **Production Deployments:** Automatic on push to main branch

### Configuration
- **Location:** `vercel.json` → `github`
- **Current:**
  ```json
  {
    "github": {
      "enabled": true,
      "autoAlias": true,
      "autoJobCancelation": true,
      "silent": false
    }
  }
  ```

## Summary

### Key Points
1. **Framework:** Vite (auto-detected, no manual config needed)
2. **Build:** `npm run build:vercel || npm run build`
3. **Output:** `dist/public/`
4. **Cron Jobs:** Configured in `vercel.json`
5. **Functions:** Configured in `vercel.json` → `functions`
6. **Environment Variables:** Set in Vercel dashboard
7. **Custom Domain:** Auto-assigned after successful deployment

### Settings NOT Applicable
- Next.js Framework Settings (this is a Vite project)
- Next.js API Routes (using Express/Node.js)
- Next.js-specific optimizations

### Settings That Apply
- Build Command
- Output Directory
- Environment Variables
- Custom Domains
- Cron Jobs
- Function Configuration
- Redirects/Rewrites

## Troubleshooting

### Build Fails
1. Check `vercel.json` syntax
2. Verify build command works locally
3. Check environment variables are set
4. Review build logs in Vercel dashboard

### Domain Not Assigned
1. Check deployment status (must be "Ready")
2. Verify deployment checks pass
3. Manually promote deployment if needed
4. Check DNS configuration

### Cron Jobs Not Running
1. Verify `CRON_SECRET` is set in environment variables
2. Check cron schedule syntax
3. Test endpoint manually with correct authorization
4. Check Vercel cron logs

### Function Timeouts
1. Increase `maxDuration` in `vercel.json`
2. Optimize function code
3. Check database query performance
4. Consider caching strategies
