# 🔧 Fix Login Issue on eğitim.today (Production)

## Current Situation
- **Production Domain:** eğitim.today (xn--eitim-k1a.today)
- **Issue:** Login returns 500 `FUNCTION_INVOCATION_FAILED`
- **Status:** Fix is in code, need to verify deployment

## Step 1: Verify Production Deployment

### Check Vercel Production Deployment
1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/deployments
2. Look for deployment with **"Production"** badge (green)
3. Check if it's assigned to domain `eğitim.today` or `xn--eitim-k1a.today`
4. Verify commit includes `db0cc8c` (the fix)

### If Production Deployment is Old:
1. Go to Deployments
2. Find the latest deployment from `main` branch
3. Click "..." menu → "Promote to Production"
4. Or manually redeploy production

## Step 2: Verify Environment Variables for Production

1. Go to: https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
2. **Filter by "Production" environment** (important!)
3. Verify:
   - ✅ `DATABASE_URL` - Must be set for **Production**
   - ✅ `SESSION_SECRET` - Must be set for **Production**

**Note:** Having multiple `DATABASE_URL` entries is OK if they're for different environments. But Production MUST have one.

## Step 3: Test Production Domain

### Test Login Endpoint
```bash
curl -X POST https://eğitim.today/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -v
```

Or use the encoded domain:
```bash
curl -X POST https://xn--eitim-k1a.today/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}' \
  -v
```

**Expected:** Should return 200 (success) or 401 (invalid credentials), NOT 500

### Test Health Check
```bash
curl https://eğitim.today/api/health
```

**Expected:** `{"status":"ok",...}`

## Step 4: View Production Function Logs

1. Go to Vercel → Deployments
2. Find **Production** deployment (assigned to eğitim.today)
3. Click on it
4. Click "Functions" tab
5. Click on `api/index.ts`
6. Click "View Function Logs" or "Logs"

**Look for:**
- Actual error messages (not just FUNCTION_INVOCATION_FAILED)
- `ReferenceError: req is not defined` (should NOT appear if fix is deployed)
- Database connection errors
- Module import errors

## Step 5: Redeploy Production (If Needed)

If the production deployment doesn't have the fix:

### Option A: Promote Latest Deployment
1. Go to Deployments
2. Find latest deployment from `main` branch with the fix
3. Click "..." → "Promote to Production"

### Option B: Manual Redeploy
1. Go to Deployments
2. Find Production deployment
3. Click "..." → "Redeploy"
4. Wait for deployment to complete

## Step 6: Verify Fix is Active

After redeployment, test again:
1. Wait 2-3 minutes for deployment to complete
2. Test login endpoint
3. Check function logs for any errors
4. Verify no `FUNCTION_INVOCATION_FAILED` errors

## Troubleshooting

### If Still Getting 500 Error:

1. **Check Function Logs:**
   - Look for actual error message
   - Check if it's the same `req` reference error
   - Or if it's a different error

2. **Verify Fix is Deployed:**
   - Check deployment commit hash
   - Should include `db0cc8c` or later

3. **Check Environment Variables:**
   - DATABASE_URL must be set for Production
   - SESSION_SECRET must be set for Production

4. **Database Connection:**
   - Test `/api/health/detailed`
   - Check if database shows "connected"

## Quick Checklist

- [ ] Found Production deployment for eğitim.today
- [ ] Production deployment includes fix commit (`db0cc8c` or later)
- [ ] `DATABASE_URL` set for Production environment
- [ ] `SESSION_SECRET` set for Production environment
- [ ] Viewed production function logs
- [ ] Tested login on eğitim.today domain
- [ ] No 500 errors on login endpoint

## Next Steps

1. **Immediate:** Check production deployment status
2. **If old:** Redeploy or promote latest deployment
3. **Verify:** Test login endpoint
4. **Monitor:** Check function logs for errors

---

**Domain Note:** eğitim.today is the production domain. learnconnect.net will be available after January 20, 2026.

