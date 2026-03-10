# Fix Deployment Pipeline for LearnConnect

## Current Issues
1. ❌ Production deployment stuck at 3-day-old broken version
2. ❌ Staged deployments not automatically promoted
3. ❌ No automatic rollback on failure
4. ❌ No alerts for broken production

## Immediate Fixes Applied
We've already:
- ✅ Added SES error suppression (inline script in HTML)
- ✅ Fixed chunk initialization errors
- ✅ Improved module loading order
- ✅ Enhanced error handling

**These fixes are in the latest commits pushed to `main`.**

## Configuration Changes Needed

### 1. Update `vercel.json`

Add production promotion settings:

```json
{
  "version": 2,
  "buildCommand": "npm run build:vercel || npm run build",
  "outputDirectory": "dist/public",
  "installCommand": "npm install --include=dev",
  "productionBranch": "main",
  "autoAlias": true,
  "github": {
    "enabled": true,
    "autoAlias": true,
    "autoJobCancelation": true,
    "silent": false
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    }
  ],
  "build": {
    "env": {
      "NODE_ENV": "production",
      "SKIP_TYPE_CHECK": "true"
    }
  },
  "crons": [
    {
      "path": "/api/health",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### 2. Create Health Check API

**File: `api/health.ts`**
```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  // Health check response
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.VERCEL_GIT_COMMIT_SHA || 'unknown',
    environment: process.env.VERCEL_ENV || 'development',
    buildTime: process.env.VERCEL_BUILD_TIME || 'unknown',
    region: process.env.VERCEL_REGION || 'unknown'
  });
}
```

### 3. Vercel Dashboard Settings

**Go to:** https://vercel.com/metinbahdats-projects/learn-connect/settings/git

**Enable:**
- ✅ **Production Branch:** `main`
- ✅ **Auto-assign Custom Domains:** ON
- ✅ **Automatically promote Preview Deployments:** ON (optional, can be manual)
- ✅ **Preview Comments:** ON (for PR deployments)

**Production Branch Protection:**
- Option A: **"Automatically promote after checks pass"** (recommended for faster fixes)
- Option B: **"Require approval"** (more control, but requires manual action)

## Monitoring Setup

### 1. Vercel Analytics
- Already installed: `@vercel/analytics`
- Check: https://vercel.com/metinbahdats-projects/learn-connect/analytics

### 2. Error Monitoring (Optional)
Consider adding Sentry or similar:
```bash
npm install @sentry/react @sentry/tracing
```

### 3. Uptime Monitoring
Use services like:
- UptimeRobot (free tier available)
- Pingdom
- Better Uptime

Monitor: `https://egitim.today/api/health`

## Deployment Checklist

Before each production deployment:
- [ ] All tests pass locally
- [ ] TypeScript compilation succeeds (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Health check endpoint works
- [ ] Browser console has no errors

After each production deployment:
- [ ] Visit production URL
- [ ] Check `/api/health` endpoint
- [ ] Test critical user flows
- [ ] Monitor error logs for 15 minutes
- [ ] Verify custom domain works

## Rollback Procedure

If production breaks:

1. **Via Dashboard:**
   - Go to Deployments
   - Find last working deployment
   - Click "..." → "Rollback to this deployment"

2. **Via CLI:**
   ```bash
   vercel rollback <deployment-id> --prod
   ```

3. **Via API:**
   ```bash
   curl -X POST "https://api.vercel.com/v13/deployments/<id>/rollback" \
     -H "Authorization: Bearer $VERCEL_TOKEN"
   ```

## Automatic Deployment Workflow

Current flow (should be):
1. Push to `main` branch
2. Vercel detects push
3. Builds automatically
4. Creates deployment
5. Runs checks
6. **Auto-promotes to production** (if enabled)
7. Assigns custom domain automatically

## Troubleshooting

### Deployment not promoting automatically:
- Check Git settings in Vercel
- Verify production branch is `main`
- Check if protection rules are blocking

### Domain not updating:
- Wait 2-5 minutes for DNS propagation
- Check domain settings in Vercel
- Verify domain is assigned to correct deployment

### Build fails:
- Check build logs in Vercel dashboard
- Run build locally: `npm run build`
- Check environment variables are set
- Verify all dependencies are in `package.json`

---

**Priority Actions:**
1. ✅ Promote latest working deployment NOW (see URGENT_PROMOTE_DEPLOYMENT.md)
2. ✅ Configure automatic promotion in Vercel settings
3. ✅ Add health check endpoint
4. ✅ Set up monitoring/alerts
5. ✅ Test deployment workflow
