# 🔧 Fix Login on eğitim.today (Production)

## Current Status
- **Production Domain:** eğitim.today (xn--eitim-k1a.today)
- **Issue:** Login returns 500 `FUNCTION_INVOCATION_FAILED`
- **Fix:** Already in code (commit `db0cc8c`), needs to be deployed to production

## Quick Fix Steps

### Step 1: Verify Production Deployment Has the Fix

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Find deployment assigned to **eğitim.today** (Production)
3. Check commit hash - should include `db0cc8c` or later
4. If old, promote latest deployment or redeploy

### Step 2: Verify Environment Variables

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
2. **Filter by "Production"** environment
3. Verify:
   - ✅ `DATABASE_URL` set for **Production**
   - ✅ `SESSION_SECRET` set for **Production**

### Step 3: Test Production Domain

Run the test script:
```powershell
.\test-egitim-today.ps1
```

Or test manually:
```bash
curl -X POST https://xn--eitim-k1a.today/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'
```

**Expected:** 200 (success) or 401 (invalid), NOT 500

### Step 4: Check Function Logs

1. Production deployment → Functions → api/index.ts → Logs
2. Look for actual error messages
3. Should NOT see `ReferenceError: req is not defined`

## If Still Failing

1. **Redeploy Production:**
   - Go to Deployments
   - Find Production deployment
   - Click "..." → "Redeploy"
   - Wait for completion

2. **Check Logs:**
   - View function logs after redeployment
   - Look for actual error (not just FUNCTION_INVOCATION_FAILED)

3. **Verify Fix:**
   - Check deployment includes commit `db0cc8c`
   - Test login endpoint again

## Domain Note

- **Current:** eğitim.today (production)
- **Future:** learnconnect.net (available after Jan 20, 2026)

