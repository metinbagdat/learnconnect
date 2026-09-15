# 🔍 Debug Login 500 Error - Step by Step

## Current Situation
- ✅ Code fix applied (commit `db0cc8c`)
- ❌ Login still returns 500 `FUNCTION_INVOCATION_FAILED`
- ⚠️ Need to verify actual production deployment

## Critical Issue: Deployment Branch

**The screenshot shows deployment from `preview/pr-8-main` - this is NOT production!**

### Step 1: Find Production Deployment

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Look for deployments marked as **"Production"** (not "Preview")
3. Check the commit hash - it should include `db0cc8c` or later
4. If production deployment is old, you need to:
   - Either merge the fix to main (already done)
   - Or manually redeploy production

### Step 2: Check Production Domain

The error is happening on your production domain. Verify:
- What is your actual production domain?
- Is it `learnconnect.net` or `learn-connect.vercel.app`?
- Make sure you're testing the PRODUCTION domain, not a preview URL

### Step 3: View Function Logs (Production Deployment)

**For Production Deployment:**
1. Go to Vercel → Deployments
2. Find the **Production** deployment (green badge, not preview)
3. Click on it
4. Click **"Functions"** tab
5. Click on **`api/index.ts`**
6. Click **"View Function Logs"** or **"Logs"** tab

**What to look for:**
- Error messages with stack traces
- `ReferenceError: req is not defined` (should NOT appear if fix is deployed)
- `FUNCTION_INVOCATION_FAILED` with error details
- Database connection errors
- Module import errors

### Step 4: Test Production Endpoint

```bash
# Replace with your actual production domain
curl -X POST https://learnconnect.net/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -v
```

**Check:**
- Status code (should be 200 or 401, NOT 500)
- Response body
- Error message if any

### Step 5: Verify Environment Variables (Production)

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
2. Filter by **"Production"** environment
3. Verify:
   - ✅ `DATABASE_URL` exists and is set for Production
   - ✅ `SESSION_SECRET` exists and is set for Production

**Important:** Multiple `DATABASE_URL` entries are OK if they're for different branches. But Production must have one.

### Step 6: Check Build Logs

1. Go to Production deployment
2. Click "View Build Logs"
3. Look for:
   - Build errors
   - TypeScript compilation errors
   - Module resolution errors
   - Any warnings that might cause runtime issues

### Step 7: Verify Fix is Deployed

Check if commit `db0cc8c` is in the production deployment:
1. Go to Production deployment
2. Check the commit hash/message
3. Should see: "Fix FUNCTION_INVOCATION_FAILED: Remove req reference from LocalStrategy"

If not present:
- The fix hasn't been deployed to production yet
- Need to redeploy or wait for auto-deployment

## Common Issues

### Issue 1: Testing Preview Instead of Production
**Symptom:** Testing `preview/pr-8-main` deployment
**Solution:** Test the actual production domain

### Issue 2: Old Deployment
**Symptom:** Production deployment is from before the fix
**Solution:** 
- Wait for auto-deployment (if enabled)
- Or manually redeploy production

### Issue 3: Environment Variables Not Set
**Symptom:** Database connection errors in logs
**Solution:** Set `DATABASE_URL` and `SESSION_SECRET` for Production

### Issue 4: Build Didn't Include Fix
**Symptom:** Deployment shows old commit
**Solution:** Check git history, ensure fix is in main branch

## Quick Verification Checklist

- [ ] Found Production deployment (not Preview)
- [ ] Production deployment includes commit `db0cc8c` or later
- [ ] `DATABASE_URL` set for Production environment
- [ ] `SESSION_SECRET` set for Production environment
- [ ] Viewed function logs from Production deployment
- [ ] Tested login on Production domain (not preview)
- [ ] Checked build logs for errors

## Next Steps After Debugging

Once you identify the issue:
1. If fix not deployed → Redeploy production
2. If env vars missing → Add them
3. If different error → Check logs for actual error message
4. If still failing → Share the actual error from logs

## How to Get Function Logs

**Method 1: Vercel Dashboard**
1. Deployments → Production → Functions → api/index.ts → Logs

**Method 2: Vercel CLI**
```bash
vercel logs --follow
```

**Method 3: Real-time Testing**
1. Make a login request
2. Immediately check logs
3. Look for the request ID in logs

---

**Most Important:** Make sure you're checking the **Production** deployment, not a Preview deployment!

