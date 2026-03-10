# 🚨 URGENT: Production Environment Variables Missing

## Critical Issue Found

Based on Vercel dashboard screenshots, **ANTHROPIC_API_KEY is only set for Preview environment, NOT for Production!**

This means:
- ❌ Production deployments will **FAIL** when trying to use AI features
- ❌ Server may crash on startup if AI routes are loaded
- ✅ Preview deployments work (because variables are set there)

## Immediate Fix Required

### Step 1: Set ANTHROPIC_API_KEY for Production

**Go to:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

1. Find `ANTHROPIC_API_KEY` in the list
2. Click the three-dot menu (⋮) next to it
3. Click "Edit"
4. **IMPORTANT:** Check "Production" environment checkbox
5. Click "Save"

**Current Status:**
- ✅ Preview: Set
- ❌ Production: **NOT SET** ← FIX THIS

**Value to use:**
```
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
```

### Step 2: Verify DATABASE_URL for Production

**Check if DATABASE_URL is set for Production:**
- In environment variables list, look for `DATABASE_URL`
- Verify it shows "Production" in the Environment column
- If not, add it for Production environment

**Required format:**
```
postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

**Important:** Must include `-pooler` in hostname!

### Step 3: Set SESSION_SECRET for Production

**Generate SESSION_SECRET:**
```powershell
.\scripts\generate-session-secret.ps1
```

**Or use this value (already generated):**
```
ODMkyN2DtScq3lqRygfxvC8WCd2WPmIiZKG6dFd/Jl0=
```

**Set in Vercel:**
1. Go to Environment Variables
2. Click "Add New"
3. Name: `SESSION_SECRET`
4. Value: `ODMkyN2DtScq3lqRygfxvC8WCd2WPmIiZKG6dFd/Jl0=`
5. **Select "Production" environment**
6. Click "Save"

### Step 4: Verify All Critical Variables for Production

**Checklist (must show "Production" in Environment column):**

- [ ] `DATABASE_URL` → Production
- [ ] `ANTHROPIC_API_KEY` → Production ← **URGENT**
- [ ] `ANTHROPIC_MODEL` → Production (already set ✅)
- [ ] `SESSION_SECRET` → Production

### Step 5: Redeploy After Setting Variables

**After setting variables:**

1. **Option A: Manual Redeploy**
   - Vercel Dashboard → Deployments
   - Latest deployment → "..." → "Redeploy"

2. **Option B: Trigger New Deployment**
   - Make a small commit and push
   - Or use: `vercel --prod`

## Why This Matters

**Current Situation:**
- Preview deployments work (variables set)
- Production deployments fail (variables missing)
- Custom domain (eğitim.today) uses Production environment
- Therefore: eğitim.today may not work correctly

**After Fix:**
- Production deployments will work
- AI endpoints will function
- Custom domain will work properly

## Verification

After setting variables and redeploying:

1. **Test Production URL:**
   ```powershell
   .\scripts\test-deployment-comprehensive.ps1
   ```

2. **Check Runtime Logs:**
   - Vercel Dashboard → Latest Deployment → Runtime Logs
   - Should see: "Application fully initialized"
   - No errors about missing ANTHROPIC_API_KEY

3. **Test AI Endpoint:**
   ```powershell
   # Should return 401 (auth required) or 400 (validation), NOT 500
   Invoke-WebRequest -Uri "https://eğitim.today/api/ai/adaptive-plan" -Method POST -Body '{"test":"ping"}' -ContentType "application/json"
   ```

## Quick Reference

**Vercel Environment Variables:**
https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

**Current Status:**
- ANTHROPIC_MODEL: ✅ Production + Preview
- ANTHROPIC_API_KEY: ❌ Preview only (needs Production!)
- DATABASE_URL: ⚠️ Check if Production is set
- SESSION_SECRET: ⚠️ Check if Production is set

