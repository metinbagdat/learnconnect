# 🚨 Quick Start: Fix Production Environment Variables

## The Problem

**ANTHROPIC_API_KEY is only set for Preview, NOT for Production!**

This causes Production deployments (including `eğitim.today`) to fail when accessing AI features.

## 3-Minute Fix

### Step 1: Open Vercel Dashboard
👉 https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

### Step 2: Fix ANTHROPIC_API_KEY (URGENT)

1. Find `ANTHROPIC_API_KEY` in the list
2. Click the **three-dot menu (⋮)** → **"Edit"**
3. **Check "Production" checkbox** ✅
4. Click **"Save"**

**Current Status:**
- ✅ Preview: Set
- ❌ Production: **NOT SET** ← Fix this!

### Step 3: Verify DATABASE_URL

1. Find `DATABASE_URL` in the list
2. Check if **"Production"** appears in Environment column
3. If not: Click **Edit** → Check **"Production"** → **Save**

### Step 4: Set SESSION_SECRET

1. If `SESSION_SECRET` exists: Click **Edit** → Check **"Production"** → **Save**
2. If missing: Click **"Add New"** → 
   - Name: `SESSION_SECRET`
   - Value: `ODMkyN2DtScq3lqRygfxvC8WCd2WPmIiZKG6dFd/Jl0=`
   - Select **"Production"**
   - Click **"Save"**

### Step 5: Redeploy

**Option A (Easiest):**
- Vercel Dashboard → Deployments → Latest → **"..."** → **"Redeploy"**

**Option B:**
```powershell
git commit --allow-empty -m "Redeploy after Production env vars fix"
git push origin main
```

### Step 6: Test

```powershell
.\scripts\test-deployment-comprehensive.ps1
```

## Checklist

After completing steps above, verify:

- [ ] `ANTHROPIC_API_KEY` shows "Production" in Environment column
- [ ] `DATABASE_URL` shows "Production" in Environment column  
- [ ] `ANTHROPIC_MODEL` shows "Production" in Environment column
- [ ] `SESSION_SECRET` shows "Production" in Environment column
- [ ] Application redeployed
- [ ] Test script shows all endpoints working

## Expected Test Results

After fix:
- ✅ Health check: 200 OK
- ✅ Root endpoint: 200 OK
- ✅ AI endpoint: 401 or 400 (not 500)

## Need Help?

- **Full Guide:** See `PRODUCTION_ENV_SETUP_GUIDE.md`
- **Verify Variables:** `.\scripts\verify-production-env.ps1`
- **Set via CLI:** `.\scripts\set-vercel-env.ps1`

