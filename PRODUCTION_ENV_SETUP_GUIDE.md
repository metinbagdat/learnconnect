# Production Environment Variables Setup Guide

## 🚨 URGENT: Critical Issue

**ANTHROPIC_API_KEY is currently only set for Preview environment, NOT for Production!**

This means your Production deployments (including `eğitim.today`) will fail when accessing AI features.

## Quick Fix (5 minutes)

### Method 1: Vercel Dashboard (Recommended)

1. **Go to Environment Variables:**
   https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables

2. **Set ANTHROPIC_API_KEY for Production:**
   - Find `ANTHROPIC_API_KEY` in the list
   - Click the three-dot menu (⋮) → "Edit"
   - **Check "Production" checkbox**
   - Click "Save"

3. **Verify DATABASE_URL for Production:**
   - Find `DATABASE_URL` in the list
   - Check if "Production" appears in Environment column
   - If not, click Edit → Check "Production" → Save

4. **Set SESSION_SECRET for Production:**
   - If `SESSION_SECRET` exists: Edit → Check "Production" → Save
   - If missing: Click "Add New" → Name: `SESSION_SECRET` → Value: `ODMkyN2DtScq3lqRygfxvC8WCd2WPmIiZKG6dFd/Jl0=` → Select "Production" → Save

5. **Redeploy:**
   - Vercel Dashboard → Deployments → Latest → "..." → "Redeploy"

### Method 2: Vercel CLI

```powershell
# Install Vercel CLI (if not installed)
npm i -g vercel
vercel login
vercel link

# Set critical variables for Production
.\scripts\set-vercel-env.ps1

# Verify they're set
.\scripts\verify-production-env.ps1
```

## Required Variables Checklist

All these must show **"Production"** in the Environment column:

- [ ] **DATABASE_URL** → Production
  - Format: `postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require`
  - Must include `-pooler` in hostname!

- [ ] **ANTHROPIC_API_KEY** → Production ← **URGENT**
  - Value: `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`

- [ ] **ANTHROPIC_MODEL** → Production ✅ (already set)
  - Value: `claude-3-5-sonnet-20241022`

- [ ] **SESSION_SECRET** → Production
  - Value: `ODMkyN2DtScq3lqRygfxvC8WCd2WPmIiZKG6dFd/Jl0=`

## Current Status (from Dashboard Screenshots)

- ✅ **ANTHROPIC_MODEL**: Production + Preview
- ❌ **ANTHROPIC_API_KEY**: Preview only (needs Production!)
- ⚠️ **DATABASE_URL**: Need to verify Production
- ⚠️ **SESSION_SECRET**: Need to verify Production

## Why This Matters

**Current Situation:**
- Preview deployments work (variables set)
- Production deployments fail (variables missing)
- Custom domain (`eğitim.today`) uses Production environment
- Therefore: `eğitim.today` may not work correctly

**After Fix:**
- Production deployments will work
- AI endpoints will function
- Custom domain will work properly

## Verification Steps

### 1. Verify Variables Are Set

**Option A: Dashboard**
- Go to Environment Variables page
- Check each variable shows "Production" in Environment column

**Option B: CLI**
```powershell
.\scripts\verify-production-env.ps1
```

### 2. Redeploy Application

**Option A: Dashboard**
- Vercel Dashboard → Deployments
- Latest deployment → "..." → "Redeploy"

**Option B: Git Push**
```powershell
git commit --allow-empty -m "Trigger redeploy after env var fix"
git push origin main
```

### 3. Test Deployment

```powershell
.\scripts\test-deployment-comprehensive.ps1
```

**Expected Results:**
- ✅ Health check: 200 OK
- ✅ Root endpoint: 200 OK
- ✅ AI endpoint (no auth): 401 or 400 (not 500)
- ✅ AI endpoint (invalid payload): 400 (validation working)

### 4. Check Runtime Logs

- Vercel Dashboard → Latest Deployment → Runtime Logs
- Should see: "Application fully initialized"
- No errors about missing `ANTHROPIC_API_KEY`

## Troubleshooting

### If AI Endpoint Still Fails

1. **Check Runtime Logs:**
   - Vercel Dashboard → Latest Deployment → Runtime Logs
   - Look for errors about `ANTHROPIC_API_KEY` or Anthropic SDK

2. **Verify Variable Names:**
   - Must be exactly: `ANTHROPIC_API_KEY` (case-sensitive)
   - No trailing spaces

3. **Check Variable Value:**
   - Must start with `sk-ant-api03-`
   - Full value must be copied correctly

4. **Redeploy After Changes:**
   - Environment variable changes require redeployment
   - Variables are injected at build/runtime, not hot-reloaded

### If Connection Errors Occur

- "Temel alınan bağlantı kapatıldı" (Connection closed)
- Timeout errors

**Possible Causes:**
1. Server crash due to missing environment variable
2. Database connection issue (check `DATABASE_URL`)
3. Network timeout (check Anthropic API status)

**Solution:**
1. Check Runtime Logs for specific error
2. Verify all Production environment variables are set
3. Test health endpoint first (isolates AI-specific issues)

## Quick Reference Links

- **Environment Variables:** https://vercel.com/metinbahdats-projects/learn-connect/settings/environment-variables
- **Deployments:** https://vercel.com/metinbahdats-projects/learn-connect/deployments
- **Domains:** https://vercel.com/metinbahdats-projects/learn-connect/settings/domains

## Scripts Available

- `.\scripts\set-vercel-env.ps1` - Set environment variables via CLI
- `.\scripts\verify-production-env.ps1` - Verify Production variables
- `.\scripts\test-deployment-comprehensive.ps1` - Test all endpoints
- `.\scripts\generate-session-secret.ps1` - Generate SESSION_SECRET

