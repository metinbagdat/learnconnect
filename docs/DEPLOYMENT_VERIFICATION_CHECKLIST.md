# Deployment Verification Checklist

This checklist ensures that deployments to Vercel are verified before and after deployment.

## Pre-Deployment Checks

### ✅ Build Process
- [ ] Run `npm run build:vercel` successfully
- [ ] Run `node scripts/verify-build-process.js` (all checks pass)
- [ ] TypeScript compilation completes without blocking errors
- [ ] Build output exists in `dist/public/`
- [ ] `dist/public/index.html` exists
- [ ] Build assets are generated in `dist/public/assets/`

### ✅ Configuration
- [ ] `vercel.json` exists and is valid JSON
- [ ] `vercel.json` has correct `outputDirectory: "dist/public"`
- [ ] `api/index.ts` exists (required for serverless functions)
- [ ] Environment variables are configured in Vercel dashboard:
  - [ ] `DATABASE_URL`
  - [ ] `ANTHROPIC_API_KEY` (or `OPENAI_API_KEY`)
  - [ ] `NODE_ENV=production`
  - [ ] `SESSION_SECRET` (if using sessions)

### ✅ Code Quality
- [ ] Critical TypeScript errors are resolved
- [ ] No blocking runtime errors in server code
- [ ] Health endpoint `/api/health` is implemented
- [ ] No circular dependency issues

---

## Deployment Process

### 1. Deploy to Vercel
```bash
# Option 1: Auto-deploy via GitHub (recommended)
git add .
git commit -m "Deployment: [describe changes]"
git push origin main

# Option 2: Manual deploy
vercel --prod
```

### 2. Monitor Deployment
- [ ] Check Vercel dashboard for build status
- [ ] Review build logs for errors
- [ ] Verify build completes successfully
- [ ] Note deployment URL (e.g., `learn-connect-*.vercel.app`)

---

## Post-Deployment Verification

### ✅ Health Check
- [ ] `https://[your-app].vercel.app/api/health` returns 200 OK
- [ ] Health endpoint reports:
  - [ ] Database connection: `true`
  - [ ] AI key presence: `true`
  - [ ] Status: `healthy` or `degraded` (not `unhealthy`)

### ✅ Frontend Verification
- [ ] Homepage (`/`) loads without errors
- [ ] No console errors in browser DevTools
- [ ] No uncaught exceptions in browser console
- [ ] Static assets load correctly (JS, CSS, images)
- [ ] No 404 errors for critical resources

### ✅ API Endpoints
- [ ] `/api/health` - Health check endpoint
- [ ] `/api/auth/*` - Authentication endpoints (if applicable)
- [ ] Key API endpoints respond correctly
- [ ] No 500 errors on critical endpoints

### ✅ Domain Verification
- [ ] Production domain (`https://eğitim.today`) routes correctly
- [ ] Domain points to latest Vercel deployment
- [ ] SSL certificate is valid (HTTPS works)
- [ ] Domain DNS configuration is correct

### ✅ Functionality Tests
- [ ] User authentication flow works
- [ ] Dashboard loads correctly
- [ ] Key user workflows function properly
- [ ] Database connections work
- [ ] AI endpoints respond (if applicable)

---

## Browser Console Checks

### ✅ No Errors
- [ ] No red error messages in console
- [ ] No "Failed to load resource" errors
- [ ] No CORS errors
- [ ] No network errors for API calls
- [ ] No JavaScript runtime errors

### ⚠️ Warnings (Acceptable)
- Non-critical warnings are acceptable
- Third-party library warnings can be ignored
- Browser compatibility warnings (if expected)

---

## Performance Checks

### ✅ Load Times
- [ ] Initial page load < 3 seconds
- [ ] API responses < 1 second (for simple endpoints)
- [ ] No significant performance regressions

### ✅ Resource Loading
- [ ] Images load correctly
- [ ] Fonts load correctly
- [ ] CSS styles apply correctly
- [ ] JavaScript executes without blocking

---

## Rollback Procedure

If deployment fails or issues are detected:

1. **Identify the issue:**
   - Check Vercel deployment logs
   - Check browser console errors
   - Check API endpoint responses

2. **Rollback options:**
   ```bash
   # Option 1: Promote previous deployment in Vercel dashboard
   # Option 2: Revert git commit and redeploy
   git revert HEAD
   git push origin main
   ```

3. **Fix and redeploy:**
   - Fix the issue locally
   - Run build verification
   - Redeploy after fixes

---

## Environment-Specific Notes

### Production (`egitim.today`)
- Domain: `https://eğitim.today`
- Environment: Production
- Database: Production database
- AI Keys: Production API keys

### Preview/Staging
- URL: `*.vercel.app` preview deployments
- Environment: Preview (may use different env vars)
- Database: May use staging database
- Testing: Safe for testing new features

---

## Common Issues and Solutions

### Issue: Build fails
- **Check:** Build logs in Vercel dashboard
- **Solution:** Fix TypeScript errors, missing dependencies, or build script issues

### Issue: 500 errors on API endpoints
- **Check:** Function logs in Vercel dashboard
- **Solution:** Check environment variables, database connections, code errors

### Issue: Frontend doesn't load
- **Check:** Browser console, network tab
- **Solution:** Check build output, asset paths, routing configuration

### Issue: Domain not routing
- **Check:** DNS configuration, Vercel domain settings
- **Solution:** Verify domain is connected in Vercel dashboard

---

## Quick Verification Command

Run this after deployment:
```bash
# Check health endpoint
curl https://eğitim.today/api/health

# Expected response:
# {"status":"healthy","database":true,"aiKey":true,"timestamp":"...","uptime":...}
```

---

## Last Updated
- Date: $(Get-Date -Format "yyyy-MM-dd")
- Version: 1.0.0
